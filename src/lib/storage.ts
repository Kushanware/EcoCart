export interface ImpactMetrics {
  totalCO2Saved: number;
  productsAnalyzed: number;
  greenChoices: number;
  streak: number;
}

export const defaultMetrics: ImpactMetrics = {
  totalCO2Saved: 0,
  productsAnalyzed: 0,
  greenChoices: 0,
  streak: 0
};

export async function getMetrics(): Promise<ImpactMetrics> {
  return new Promise((resolve) => {
    if (!chrome?.storage) return resolve(defaultMetrics);
    chrome.storage.local.get(['impactMetrics'], (result) => {
      resolve((result.impactMetrics as ImpactMetrics) || defaultMetrics);
    });
  });
}

export async function updateMetrics(newMetrics: Partial<ImpactMetrics>) {
  const current = await getMetrics();
  const updated = { ...current, ...newMetrics };
  return new Promise<void>((resolve) => {
    if (!chrome?.storage) return resolve();
    chrome.storage.local.set({ impactMetrics: updated }, () => {
      resolve();
    });
  });
}

export async function incrementMetrics(add: Partial<ImpactMetrics>) {
  const current = await getMetrics();
  const updated = { ...current };
  if (add.totalCO2Saved) updated.totalCO2Saved += add.totalCO2Saved;
  if (add.productsAnalyzed) updated.productsAnalyzed += add.productsAnalyzed;
  if (add.greenChoices) updated.greenChoices += add.greenChoices;
  
  return new Promise<void>((resolve) => {
    if (!chrome?.storage) return resolve();
    chrome.storage.local.set({ impactMetrics: updated }, () => {
      resolve();
    });
  });
}

export async function getApiKey(): Promise<string> {
  return new Promise((resolve) => {
    if (!chrome?.storage) return resolve('');
    chrome.storage.local.get(['geminiApiKey'], (result) => {
      resolve((result.geminiApiKey as string) || '');
    });
  });
}

export async function saveApiKey(key: string) {
  return new Promise<void>((resolve) => {
    if (!chrome?.storage) return resolve();
    chrome.storage.local.set({ geminiApiKey: key }, () => {
      resolve();
    });
  });
}
