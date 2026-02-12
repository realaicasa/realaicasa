import { PropertySchema } from '../types';

/**
 * Formats a WhatsApp sharing URL for a specific property
 * @param property The property to share
 * @param businessName The name of the agency
 * @param baseUrl The base URL of the app
 * @returns string WhatsApp API URL
 */
export const getWhatsAppShareUrl = (property: PropertySchema, businessName: string, baseUrl: string): string => {
  const address = property.listing_details?.address || 'Premium Asset';
  const price = property.listing_details?.price ? `$${property.listing_details.price.toLocaleString()}` : 'Contact for Price';
  const beds = property.listing_details?.key_stats?.bedrooms || 0;
  const sqft = property.listing_details?.key_stats?.sq_ft || 0;
  
  const text = `✨ *Elite Property Opportunity* ✨\n\n` +
               `*${address}*\n` +
               `💰 Price: ${price}\n` +
               `🏠 Specs: ${beds} Bed | ${sqft.toLocaleString()} sqft\n\n` +
               `Interested in this ${property.category} asset? View the full details and contact me here:\n` +
               `${baseUrl}/?property=${property.property_id}\n\n` +
               `_Sent via ${businessName} Concierge._`;

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

/**
 * Formats an email sharing URL
 */
export const getEmailShareUrl = (property: PropertySchema, businessName: string, baseUrl: string): string => {
  const address = property.listing_details?.address || 'Premium Asset';
  const subject = `Elite Property Listing: ${address}`;
  const body = `Hello,\n\nI thought you might be interested in this exclusive listing from ${businessName}:\n\n` +
               `${address}\n` +
               `View full details and secure documents here: ${baseUrl}/?property=${property.property_id}`;

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
