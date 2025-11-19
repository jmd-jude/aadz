#!/usr/bin/env node

/**
 * Test script to compare template responses
 * Tests if template ID actually limits fields returned
 */

const crypto = require('crypto');

// Your configuration
const AA_KEY_ID = process.env.AA_KEY_ID_DEV || 'knYgY5kj00nzYN4F';
const AA_SECRET = process.env.AA_SECRET_DEV || 'TwdfUDbmYJ57XREhkELuDkoVmKZWs3wn';
const AA_ORIGIN = 'https://api.audienceacuity.com';

// Test device ID
const TEST_DEVICE = '60ff5214-92ec-4c54-b388-7ff01d97d69f';

// Create auth header
function createAuthHeader() {
  const timestamp = Date.now().toString();
  const toHash = timestamp + AA_SECRET;
  const hash = crypto.createHash('md5').update(toHash).digest('hex');
  return `${AA_KEY_ID}${timestamp}${hash}`;
}

// Test with different template configurations
async function testTemplate(templateId, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${label}`);
  console.log(`${'='.repeat(60)}`);

  const params = new URLSearchParams({ deviceId: TEST_DEVICE });
  if (templateId) {
    params.append('templateId', templateId);
  }

  const url = `${AA_ORIGIN}/v2/identities/byDevice?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': createAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`❌ Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(text);
      return null;
    }

    const data = await response.json();
    const responseSize = JSON.stringify(data).length;

    console.log(`✅ Success!`);
    console.log(`   Response size: ${(responseSize / 1024).toFixed(1)} KB`);
    console.log(`   Identities found: ${data.identities?.length || 0}`);

    if (data.identities && data.identities.length > 0) {
      const identity = data.identities[0];
      const topLevelKeys = Object.keys(identity);

      console.log(`   Top-level fields: ${topLevelKeys.length}`);
      console.log(`   Fields: ${topLevelKeys.slice(0, 10).join(', ')}...`);

      // Check for key data sections
      const sections = {
        'emails': identity.emails?.length || 0,
        'phones': identity.phones?.length || 0,
        'devices': identity.devices?.length || 0,
        'vehicles': identity.vehicles?.length || 0,
        'properties': identity.properties?.length || 0,
        'ips': identity.ips?.length || 0,
        'data': identity.data ? Object.keys(identity.data).length : 0,
        'finances': identity.finances ? Object.keys(identity.finances).length : 0
      };

      console.log(`\n   Data sections:`);
      for (const [section, count] of Object.entries(sections)) {
        if (count > 0) {
          console.log(`     • ${section}: ${count} ${section === 'data' || section === 'finances' ? 'fields' : 'items'}`);
        }
      }

      // Show sample of what's in the data object
      if (identity.data) {
        const dataKeys = Object.keys(identity.data);
        console.log(`\n   Sample data fields:`);
        console.log(`     ${dataKeys.slice(0, 20).join(', ')}...`);
      }
    }

    return data;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

// Also test with the aa-api package
async function testWithAaApiPackage() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: Using aa-api NPM Package`);
  console.log(`${'='.repeat(60)}`);

  try {
    const { Identities } = require('aa-api');

    // Configure with your credentials
    Identities.setDefaults({
      keyId: AA_KEY_ID,
      secret: AA_SECRET,
      template: 223323710 // Your template
    });

    console.log('Calling byDevice with aa-api package...');
    const result = await Identities.byDevice(TEST_DEVICE);

    const responseSize = JSON.stringify(result).length;
    console.log(`✅ Success!`);
    console.log(`   Response size: ${(responseSize / 1024).toFixed(1)} KB`);
    console.log(`   Identities found: ${result.identities?.length || 0}`);

    if (result.identities && result.identities.length > 0) {
      const identity = result.identities[0];
      const topLevelKeys = Object.keys(identity);
      console.log(`   Top-level fields: ${topLevelKeys.length}`);
      console.log(`   Fields: ${topLevelKeys.slice(0, 10).join(', ')}...`);
    }

    return result;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Template Comparison Test');
  console.log(`Using device: ${TEST_DEVICE}`);

  // Test 1: No template
  const noTemplate = await testTemplate(null, 'No Template ID');

  // Test 2: Your template
  const yourTemplate = await testTemplate('223323710', 'Your Template (223323710)');

  // Test 3: Example template from docs
  const exampleTemplate = await testTemplate('79123584', 'Example Template (79123584)');

  // Test 4: Using aa-api package
  const aaApiResult = await testWithAaApiPackage();

  // Comparison
  console.log(`\n${'='.repeat(60)}`);
  console.log('COMPARISON SUMMARY');
  console.log(`${'='.repeat(60)}`);

  const sizes = {
    'No template': noTemplate ? JSON.stringify(noTemplate).length : 0,
    'Your template (223323710)': yourTemplate ? JSON.stringify(yourTemplate).length : 0,
    'Example template (79123584)': exampleTemplate ? JSON.stringify(exampleTemplate).length : 0,
    'aa-api package': aaApiResult ? JSON.stringify(aaApiResult).length : 0
  };

  for (const [label, size] of Object.entries(sizes)) {
    if (size > 0) {
      console.log(`${label.padEnd(35)} ${(size / 1024).toFixed(1).padStart(8)} KB`);
    } else {
      console.log(`${label.padEnd(35)} ${' FAILED'.padStart(8)}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('CONCLUSION:');
  console.log(`${'='.repeat(60)}`);

  const validSizes = Object.values(sizes).filter(s => s > 0);
  const allSame = validSizes.every(s => Math.abs(s - validSizes[0]) < 1000);

  if (allSame) {
    console.log('⚠️  All responses are roughly the same size!');
    console.log('    This suggests template ID may not be limiting fields,');
    console.log('    OR your template is configured to return all fields.');
  } else {
    console.log('✅ Different templates return different amounts of data!');
    console.log('    Templates are working as expected.');
  }

  console.log('\n💡 Next step: Check your template configuration in AA dashboard');
  console.log('   to see what fields it\'s set to return.');
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
