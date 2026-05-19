/**
 * AI Assistant Chat Service
 * Integrates with Google Gemini API using the provided API Key.
 * Supports dynamic live system context and Google Search Grounding for online information!
 */

import { apiFetch } from './api';

const API_KEY = 'AIzaSyDwY8g1iE3-ppXOyb88iR6drCNNF6dprkE';

/**
 * Gets a response from the Google Gemini API.
 * @param {string} userMessage The latest message typed by the user.
 * @param {Array} chatHistory Array of previous chat messages in the format [{ sender: 'user'|'bot', text: string }].
 * @param {Object} user The logged-in user object containing customer details.
 * @returns {Promise<string>} The response from the AI assistant.
 */
export const getAIChatResponse = async (userMessage, chatHistory = [], user = null) => {
  // 1. Fetch live system context dynamically from local C# API
  let systemInfo = '';
  if (user && user.id) {
    try {
      const [v, a, pr, h, parts] = await Promise.all([
        apiFetch(`/Customers/${user.id}/vehicles`),
        apiFetch(`/Service/appointments?customerId=${user.id}`),
        apiFetch(`/Service/special-part-requests?customerId=${user.id}`),
        apiFetch(`/Customers/${user.id}/history`),
        apiFetch('/parts')
      ]).catch(() => [null, null, null, null, null]);

      systemInfo += `\n\nCURRENT LOCAL SYSTEM INFORMATION:`;
      systemInfo += `\n• Logged-in Customer Name: ${user.name || user.username || 'Customer'} (ID: ${user.id})`;
      
      if (v && v.length > 0) {
        systemInfo += `\n• Registered Vehicles in Garage:\n` + v.map(item => `  - ${item.make} ${item.model} (${item.plateNumber || 'N/A'}, Year: ${item.year || 'N/A'}, Mileage: ${item.mileage || 0} km)`).join('\n');
      } else {
        systemInfo += `\n• Registered Vehicles in Garage: None registered.`;
      }
      
      if (a && a.length > 0) {
        systemInfo += `\n• Upcoming Service Bookings:\n` + a.map(item => `  - Date: ${item.appointmentDate}, Time: ${item.appointmentTime || 'N/A'}, Service: ${item.serviceType}, Status: ${item.status || 'Scheduled'}`).join('\n');
      } else {
        systemInfo += `\n• Upcoming Service Bookings: No upcoming appointments scheduled.`;
      }
      
      if (pr && pr.length > 0) {
        systemInfo += `\n• Special Order Parts Requests:\n` + pr.map(item => `  - Part Category: ${item.partName}, Vehicle: ${item.vehicleDetails}`).join('\n');
      }
      
      if (h && h.length > 0) {
        systemInfo += `\n• Invoices & Purchase History:\n` + h.map(item => `  - Date: ${new Date(item.date || item.createdAt).toLocaleDateString()}, Total: Rs. ${item.totalAmount?.toFixed(2) || item.total || 'N/A'}`).join('\n');
      }

      // Add the real database parts inventory
      if (parts && parts.length > 0) {
        systemInfo += `\n• Actual Parts Inventory in Real-Time Database:\n` + parts
          .slice(0, 35) // Enforce a sensible context window limit
          .map(item => `  - Part: ${item.name} (Code: ${item.partCode || 'N/A'}, Price: Rs. ${item.price}, Stock Level: ${item.stockLevel ?? 0}, Vendor: ${item.vendorName || 'N/A'}, Description: ${item.description || 'N/A'}, Status: ${item.isActive ? 'Active' : 'Inactive'})`)
          .join('\n');
      } else {
        systemInfo += `\n• Actual Parts Inventory in Real-Time Database: No parts currently in inventory.`;
      }
    } catch (err) {
      console.error('Error constructing live context in aiService:', err);
    }
  }

  // 2. Convert UI chat message history into Gemini's format (roles: 'user' and 'model')
  const contents = [
    ...chatHistory
      .filter((msg, idx) => !(idx === 0 && msg.sender === 'bot')) // Skip initial static greeting
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];

  // 3. Define the system instructions for the VPMS context
  // Enforces checking the actual parts inventory and stops hallucinating generic parts
  const systemInstruction = {
    parts: [
      {
        text: `You are a helpful and knowledgeable AI Assistant for VPMS (Vehicle Parts & Management System), a premium garage and vehicle inventory management platform. You can help users with service bookings (like oil changes, filters, brake servicing, tire rotation), special part orders/requests, managing their garage/vehicles, and reviewing service histories. Keep your answers friendly, concise, and focused on assisting them with their vehicle concerns.

CRITICAL RULES:
1. You MUST check the "Actual Parts Inventory in Real-Time Database" listed below before answering any questions about available parts. 
2. ONLY tell the user that a part is available or in stock if it actually exists in that database list with a Stock Level > 0.
3. If a part is not listed in the "Actual Parts Inventory in Real-Time Database" below, you MUST state that it is not currently in stock. Never make up or assume parts exist. 
4. If a part is out of stock or not listed, politely suggest the customer submit a "Special Order Part Request" (via the "Special Orders" sidebar menu) so the garage can source it for them!
5. Avoid using any markdown bold formatting (do not include double asterisks **). Also, do not use asterisks (*) for lists; instead, use standard unicode bullet points (•) or numbered lists (1., 2., etc.) for listing items.

You have access to Google Search to look up real-time online information for parts, prices, vehicle models, diagnostic queries, or general web questions. Use the search tool to ground your answers with accurate online details when appropriate.${systemInfo}`
      }
    ]
  };

  try {
    // 4. Request with Google Search Tool enabled for web searches
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction,
        tools: [
          {
            googleSearch: {}
          }
        ],
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      return `Sorry, I encountered an error: ${errorData?.error?.message || 'Failed to get response'}`;
    }

    const data = await response.json();
    
    // In Gemini response, output is located in candidates[0].content.parts[0].text
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const rawText = data.candidates[0].content.parts[0].text;
      
      // Dual-layer protection: 
      // 1. Strip out bold double-asterisks (**)
      // 2. Convert list asterisks (* ) to clean unicode bullet points (• )
      return rawText
        .replaceAll('**', '')
        .replaceAll('* ', '• ')
        .replaceAll(' *', ' •')
        .trim();
    }
    
    return "I received an empty response. Please try asking again.";
  } catch (error) {
    console.error('Gemini API Network/Fetch Error:', error);
    return "I'm having trouble connecting to the AI service right now. Please check your internet connection and try again!";
  }
};
