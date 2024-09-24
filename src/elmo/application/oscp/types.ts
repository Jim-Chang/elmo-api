import {
  CapacityForecastType,
  ForecastedBlockUnit,
  PhaseIndicator,
} from '../../adapter/in/dto/enums';

export class CsmsOscpRequestFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsmsOscpRequestFailedError';
  }
}

export interface ForecastedBlock {
  capacity: number;
  phase: PhaseIndicator;
  unit: ForecastedBlockUnit;
  start_time: string;
  end_time: string;
}

export interface UpdateGroupCapacityForecast {
  group_id: string;
  type: CapacityForecastType;
  forecasted_blocks: ForecastedBlock[];
}
