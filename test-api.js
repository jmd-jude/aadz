#!/usr/bin/env node

/**
 * Test script for the Device Validation API
 *
 * Usage:
 *   node test-api.js                    # Test with first 5 device IDs
 *   node test-api.js --all              # Test with all device IDs
 *   node test-api.js --count 10         # Test with first 10 device IDs
 *   node test-api.js --device <id>      # Test with a specific device ID
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || '40e284ab9484869860e7cf4224966c7f';
const DEVICE_IDS_FILE = './documentation/sample_device_ids.csv';

// Parse command line arguments
const args = process.argv.slice(2);
let testCount = 5; // Default to first 5 devices
let testAll = false;
let specificDevice = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--all') {
    testAll = true;
  } else if (args[i] === '--count' && args[i + 1]) {
    testCount = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--device' && args[i + 1]) {
    specificDevice = args[i + 1];
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Usage:
  node test-api.js                    # Test with first 5 device IDs
  node test-api.js --all              # Test with all device IDs
  node test-api.js --count 10         # Test with first 10 device IDs
  node test-api.js --device <id>      # Test with a specific device ID
  node test-api.js --help             # Show this help message

Environment variables:
  API_URL     API base URL (default: http://localhost:3000)
  API_KEY     API key for authentication (default: 40e284ab9484869860e7cf4224966c7f)
    `);
    process.exit(0);
  }
}

// Load device IDs from CSV
function loadDeviceIds() {
  try {
    const fileContent = fs.readFileSync(DEVICE_IDS_FILE, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true // Handle BOM character if present
    });

    return records.map((record) => {
      // Get the first column value (handles different column names)
      const deviceId = Object.values(record)[0];
      return deviceId;
    });
  } catch (error) {
    console.error(`Error loading device IDs: ${error.message}`);
    process.exit(1);
  }
}

// Test a single device ID
async function testDeviceValidation(deviceId) {
  const url = `${API_BASE_URL}/v1/validate`;

  const requestBody = {
    device_id: deviceId,
    ip_address: '192.168.1.100', // Mock IP for testing
    session_timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    return {
      deviceId,
      status: response.status,
      success: response.ok,
      data
    };
  } catch (error) {
    return {
      deviceId,
      status: 0,
      success: false,
      error: error.message
    };
  }
}

// Format results for display
function formatResult(result, index) {
  const statusEmoji = result.success ? '✅' : '❌';
  const status = result.status === 0 ? 'ERROR' : result.status;

  console.log(`\n${statusEmoji} Test #${index + 1} - Device: ${result.deviceId.substring(0, 8)}...`);
  console.log(`   Status: ${status}`);

  if (result.success && result.data.validated !== undefined) {
    console.log(`   Validated: ${result.data.validated ? '✅ YES' : '❌ NO'}`);
    console.log(`   Confidence: ${(result.data.confidence_score * 100).toFixed(1)}%`);
    console.log(`   Response Time: ${result.data.response_time_ms}ms`);

    if (result.data.signals && result.data.signals.length > 0) {
      console.log(`   Signals:`);
      result.data.signals.forEach((signal) => {
        console.log(`     • ${signal}`);
      });
    }
  } else if (result.error) {
    console.log(`   Error: ${result.error}`);
  } else if (result.data.error) {
    console.log(`   Error: ${result.data.error}`);
    if (result.data.message) {
      console.log(`   Message: ${result.data.message}`);
    }
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Device Validation API Test Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Device IDs File: ${DEVICE_IDS_FILE}\n`);

  let deviceIds;

  if (specificDevice) {
    deviceIds = [specificDevice];
    console.log(`Testing specific device: ${specificDevice}\n`);
  } else {
    deviceIds = loadDeviceIds();
    console.log(`Loaded ${deviceIds.length} device IDs from CSV`);

    if (testAll) {
      console.log(`Testing all ${deviceIds.length} devices...\n`);
    } else {
      deviceIds = deviceIds.slice(0, testCount);
      console.log(`Testing first ${deviceIds.length} devices...\n`);
    }
  }

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < deviceIds.length; i++) {
    const result = await testDeviceValidation(deviceIds[i]);
    results.push(result);
    formatResult(result, i);

    // Small delay between requests to avoid overwhelming the API
    if (i < deviceIds.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${results.filter((r) => r.success).length}`);
  console.log(`Failed: ${results.filter((r) => !r.success).length}`);

  if (results.filter((r) => r.success).length > 0) {
    const validatedCount = results.filter((r) => r.success && r.data.validated).length;
    const notValidatedCount = results.filter((r) => r.success && !r.data.validated).length;
    console.log(`  • Validated: ${validatedCount}`);
    console.log(`  • Not Validated: ${notValidatedCount}`);

    const avgConfidence =
      results
        .filter((r) => r.success && r.data.confidence_score !== undefined)
        .reduce((sum, r) => sum + r.data.confidence_score, 0) /
      results.filter((r) => r.success).length;
    console.log(`Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);

    const avgResponseTime =
      results
        .filter((r) => r.success && r.data.response_time_ms !== undefined)
        .reduce((sum, r) => sum + r.data.response_time_ms, 0) /
      results.filter((r) => r.success).length;
    console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  }

  console.log(`Total Test Duration: ${totalTime}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Exit with error code if any tests failed
  if (results.filter((r) => !r.success).length > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
