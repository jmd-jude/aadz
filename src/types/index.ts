// Request types
export interface ValidationRequest {
  device_id: string;
  ip_address: string;
  session_timestamp: string;
}

// AA API Response types (based on aa_api_templates.yaml)
export interface AAApiResponse {
  input: {
    deviceId: string;
  };
  identities: AAIdentity[];
}

export interface AAIdentity {
  validated?: boolean;
  emails?: AAEmail[];
  ips?: AAIp[];
}

export interface AAEmail {
  updateDate?: string;
  sha256?: string;
  qualityLevel?: number;
}

export interface AAIp {
  frequency?: number;
  intensity?: number;
  strength?: number;
}

// Response types
export interface ValidationResponse {
  device_id: string;
  validated: boolean;
  confidence_score: number;
  signals: string[];
  response_time_ms: number;
  aa_response?: AAApiResponse; // Optional: include raw AA response for debugging
}

// Scoring types
export interface ScoringAlgorithm {
  templateId: string;
  templateName: string;
  calculate: (aaResponse: AAApiResponse) => ScoringResult;
}

export interface ScoringResult {
  confidence_score: number;
  validated: boolean;
  signals: string[];
}

// Configuration types
export interface ApiConfig {
  aaKeyId: string;
  aaSecret: string;
  aaOrigin: string;
  templateId: string;
}
