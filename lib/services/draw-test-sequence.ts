export interface DrawRunOptions {
  forceSpecialPair: boolean;
}

let runCounter = 0;

export function resetDrawRunCounter(): void {
  runCounter = 0;
}

export function nextDrawRunNumber(): number {
  runCounter += 1;
  return runCounter;
}

export function forceSpecialPairForRun(run: number): boolean {
  return run === 1 || run === 2 || run === 4;
}

export function drawOptionsForRun(run: number): DrawRunOptions {
  return { forceSpecialPair: forceSpecialPairForRun(run) };
}