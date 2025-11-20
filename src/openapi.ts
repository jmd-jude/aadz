export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Device Validation API',
    version: '1.0.0',
    description: `
# Device Validation API

This API validates device IDs to detect potential fraud.

## Authentication

All API requests require an API key to be included in the \`X-API-Key\` header.

\`\`\`
X-API-Key: your-api-key-here
\`\`\`

## How it works

1. Client sends device ID and metadata to \`/v1/validate\`
2. API queries SIG
3. Confidence score is calculated based on multiple signals
4. Returns validation result with confidence score and contributing signals

## Response Time

Target response time: <200ms (actual times may vary based on network and AA API performance)
    `.trim(),
    contact: {
      name: 'Support',
      email: 'jude.hoffner@audienceacuity.com'
    }
  },
  servers: [
    {
      url: 'https://aadz.vercel.app',
      description: 'Production server'
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for authentication'
      }
    },
    schemas: {
      ValidationRequest: {
        type: 'object',
        required: ['device_id', 'ip_address', 'session_timestamp'],
        properties: {
          device_id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique device identifier',
            example: 'c925255d-3ab1-4e56-92cd-645ece08cdf9'
          },
          ip_address: {
            type: 'string',
            format: 'ipv4',
            description: 'IP address of the device',
            example: '192.168.1.1'
          },
          session_timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 timestamp of the session',
            example: '2025-11-19T15:30:00Z'
          }
        }
      },
      ValidationResponse: {
        type: 'object',
        properties: {
          device_id: {
            type: 'string',
            description: 'The device ID that was validated'
          },
          validated: {
            type: 'boolean',
            description: 'Whether the device passed validation (confidence >= threshold)'
          },
          confidence_score: {
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 1,
            description: 'Confidence score between 0 and 1'
          },
          signals: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of signals explaining what contributed to the score'
          },
          response_time_ms: {
            type: 'integer',
            description: 'Time taken to process the request in milliseconds'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          message: {
            type: 'string',
            description: 'Detailed error description'
          }
        }
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'ok'
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      TemplatesResponse: {
        type: 'object',
        properties: {
          supported_templates: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of supported template IDs'
          },
          current_template: {
            type: 'string',
            description: 'Currently configured template ID'
          }
        }
      }
    }
  },
  security: [
    {
      ApiKeyAuth: []
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Check if the API is running',
        tags: ['System'],
        security: [],
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                }
              }
            }
          }
        }
      }
    },
    '/v1/validate': {
      post: {
        summary: 'Validate device',
        description: 'Validate a device ID against the identity graph and return confidence score',
        tags: ['Validation'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationRequest'
              },
              examples: {
                'Valid device': {
                  value: {
                    device_id: 'c925255d-3ab1-4e56-92cd-645ece08cdf9',
                    ip_address: '192.168.1.100',
                    session_timestamp: '2025-11-19T15:30:00Z'
                  }
                },
                'Another device': {
                  value: {
                    device_id: '60ff5214-92ec-4c54-b388-7ff01d97d69f',
                    ip_address: '10.0.0.1',
                    session_timestamp: '2025-11-19T16:00:00Z'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Validation successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationResponse'
                },
                examples: {
                  'Validated device': {
                    value: {
                      device_id: 'c925255d-3ab1-4e56-92cd-645ece08cdf9',
                      validated: true,
                      confidence_score: 0.9,
                      signals: [
                        'Device validated',
                        '2 email(s) associated',
                        '1 high-quality email(s)',
                        'IP data available',
                        'IP frequency: 179',
                        'IP intensity: 7370',
                        'IP strength: 1319230',
                        'Confidence score (0.90) exceeds threshold (0.85)'
                      ],
                      response_time_ms: 145
                    }
                  },
                  'Unvalidated device': {
                    value: {
                      device_id: '12345678-1234-1234-1234-123456789012',
                      validated: false,
                      confidence_score: 0.2,
                      signals: [
                        'Device not valid',
                        'Confidence score (0.20) below threshold (0.85)'
                      ],
                      response_time_ms: 132
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request - missing or invalid parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: 'Missing required field: device_id'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized - invalid or missing API key',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: 'Unauthorized: Invalid or missing API key'
                }
              }
            }
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '502': {
            description: 'Bad Gateway - error communicating with upstream service',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: 'Failed to validate device',
                  message: 'AA API error (503): Service temporarily unavailable',
                  device_id: 'c925255d-3ab1-4e56-92cd-645ece08cdf9'
                }
              }
            }
          }
        }
      }
    },
    '/v1/templates': {
      get: {
        summary: 'Get supported templates',
        description: 'List all supported SIG templates and the currently configured template',
        tags: ['System'],
        responses: {
          '200': {
            description: 'List of templates',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TemplatesResponse'
                },
                example: {
                  supported_templates: ['223323710'],
                  current_template: '223323710'
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Validation',
      description: 'Device validation endpoints'
    },
    {
      name: 'System',
      description: 'System and utility endpoints'
    }
  ]
};
