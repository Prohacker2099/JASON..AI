/**
 * Phone Service for JASON client
 * Handles communication with the phone API
 */

import axios from "axios";

const API_URL = "/api/phones";

/**
 * Get all discovered phones
 * @returns {Promise<Array>} - List of discovered phones
 */
export const getPhones = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data.devices;
  } catch (error) {
    console.error("Error fetching phones:", error);
    throw error;
  }
};

/**
 * Get phone details
 * @param {string} id - Phone ID
 * @returns {Promise<Object>} - Phone details
 */
export const getPhoneDetails = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data.info;
  } catch (error) {
    console.error(`Error fetching phone details for ${id}:`, error);
    throw error;
  }
};

/**
 * Send notification to phone
 * @param {string} id - Phone ID
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Result
 */
export const sendNotification = async (id, notification) => {
  try {
    const response = await axios.post(
      `${API_URL}/${id}/notification`,
      notification,
    );
    return response.data;
  } catch (error) {
    console.error(`Error sending notification to ${id}:`, error);
    throw error;
  }
};

/**
 * Control phone settings
 * @param {string} id - Phone ID
 * @param {Object} settings - Settings data
 * @returns {Promise<Object>} - Result
 */
export const controlSettings = async (id, settings) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/settings`, settings);
    return response.data;
  } catch (error) {
    console.error(`Error controlling settings for ${id}:`, error);
    throw error;
  }
};

/**
 * Launch app on phone
 * @param {string} id - Phone ID
 * @param {Object} appData - App data
 * @returns {Promise<Object>} - Result
 */
export const launchApp = async (id, appData) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/app`, appData);
    return response.data;
  } catch (error) {
    console.error(`Error launching app on ${id}:`, error);
    throw error;
  }
};

/**
 * Take screenshot from phone
 * @param {string} id - Phone ID
 * @returns {Promise<Object>} - Screenshot data
 */
export const takeScreenshot = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/screenshot`);
    return response.data;
  } catch (error) {
    console.error(`Error taking screenshot from ${id}:`, error);
    throw error;
  }
};

export default {
  getPhones,
  getPhoneDetails,
  sendNotification,
  controlSettings,
  launchApp,
  takeScreenshot,
};
