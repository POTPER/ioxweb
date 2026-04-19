export type StepId = 
  | '1' | '2' | '3' | '4' | '5' | '6' | '7'
  | '8' | '9'
  | '10' | '11' | '12';

export interface AppState {
  currentStep: StepId;
  data: {
    preparation?: {
      hotspot: string;
      spacing: string;
    };
    assembly?: {
      tubeModel: string;
      connectorModel: string;
      connectionMethod: string;
      alignment: string;
      fixation: string;
    };
    // ... other data fields
  };
}
