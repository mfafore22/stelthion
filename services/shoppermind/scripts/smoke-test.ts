import { endpointSmokeGate } from './release/smoke-gates.js';
import { printAndExit } from './release/report.js';

printAndExit([await endpointSmokeGate()]);
