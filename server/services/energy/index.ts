/**
 * Energy services export module - redirects to mock implementations
 * to prevent hardware errors on systems without the required hardware
 */

// Export mock implementations instead of real ones
export { 
  powerGridIntegration, 
  realEnergyMonitor,
  MockPowerGridIntegration as PowerGridIntegration,
  MockRealEnergyMonitor as RealEnergyMonitor
} from './DisableEnergyMonitoring';
