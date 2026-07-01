import { useState, useEffect, lazy, Suspense } from 'react';
import { Leaf, BarChart2, Search, Settings as SettingsIcon, Award } from 'lucide-react';
import { cn } from './lib/utils';

const PopupDashboard = lazy(() => import('./views/PopupDashboard'));
const ProductAnalysis = lazy(() => import('./views/ProductAnalysis'));
const Alternatives = lazy(() => import('./views/Alternatives'));
const ImpactDashboard = lazy(() => import('./views/ImpactDashboard'));
const Settings = lazy(() => import('./views/Settings'));
import type { ProductData } from './content';
import type { EcoAnalysis } from './lib/gemini';
import { calculateLocalEcoScore } from './lib/rules';
import { incrementMetrics } from './lib/storage';

export type ViewState = 'popup' | 'analysis' | 'alternatives' | 'impact' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('popup');
  const [productData, setProductData] = useState<Partial<ProductData> | null>(null);
  const [analysis, setAnalysis] = useState<EcoAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // When popup opens, ask the content script for product data
    if (!chrome?.tabs) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id) {
        const handleResponse = async (response: Partial<ProductData> | null | undefined) => {
          if (!response || !response.title) {
            setError('Could not find a product on this page. Please navigate to a specific product page.');
            setIsLoading(false);
            return;
          }
          
          setProductData(response);
          
          try {
            // Always use local rule engine now
            const ecoData = calculateLocalEcoScore(response);
            
            setAnalysis(ecoData);
            
            // Update storage metrics
            await incrementMetrics({
              totalCO2Saved: ecoData.ecoScore > 50 ? Number(((ecoData.ecoScore - 50) * 0.12).toFixed(2)) : 0,
              productsAnalyzed: 1,
              greenChoices: ecoData.ecoScore >= 70 ? 1 : 0
            });
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Analysis failed.');
          } finally {
            setIsLoading(false);
          }
        };

        chrome.tabs.sendMessage(activeTab.id, { action: 'extract_product' }, async (response) => {
          if (chrome.runtime.lastError || !response) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: activeTab.id as number },
                files: ['assets/content.js']
              });
              
              chrome.tabs.sendMessage(activeTab.id as number, { action: 'extract_product' }, (retryResponse) => {
                if (chrome.runtime.lastError || !retryResponse) {
                  setError('Please open a shopping website page to analyze products.');
                  setIsLoading(false);
                  return;
                }
                handleResponse(retryResponse);
              });
            } catch {
              // Failed to inject content script
              setError('Please open a shopping website page to analyze products.');
              setIsLoading(false);
            }
            return;
          }
          
          handleResponse(response);
        });
      } else {
        setIsLoading(false);
        setError('No active tab found.');
      }
    });
  }, []);

  const navItems = [
    { id: 'popup', icon: Leaf, label: 'Home' },
    { id: 'analysis', icon: Search, label: 'Analysis' },
    { id: 'alternatives', icon: Award, label: 'Better' },
    { id: 'impact', icon: BarChart2, label: 'Impact' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ] as const;

  return (
    <div className="w-[400px] h-[600px] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans text-slate-800 dark:text-slate-100">
      <header className="bg-eco-600 dark:bg-eco-700 text-white p-4 shadow-md z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">EcoCart AI</h1>
        </div>
        {currentView !== 'popup' && (
          <button 
            onClick={() => setCurrentView('popup')}
            aria-label="Go back to Home"
            className="text-eco-50 hover:text-white text-sm font-medium transition-colors"
          >
            Back
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <Suspense fallback={<div className="flex justify-center items-center h-full text-slate-500">Loading...</div>}>
          {currentView === 'popup' && <PopupDashboard onNavigate={setCurrentView} data={productData} analysis={analysis} isLoading={isLoading} error={error} />}
          {currentView === 'analysis' && <ProductAnalysis analysis={analysis} productData={productData} />}
          {currentView === 'alternatives' && <Alternatives productData={productData} />}
          {currentView === 'impact' && <ImpactDashboard />}
          {currentView === 'settings' && <Settings />}
        </Suspense>
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 z-10">
        <nav className="flex justify-around" role="navigation" aria-label="Main Navigation">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id)}
              aria-label={`Navigate to ${label}`}
              aria-current={currentView === id ? 'page' : undefined}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 w-16",
                currentView === id 
                  ? "text-eco-600 dark:text-eco-400 bg-eco-50 dark:bg-eco-900/30" 
                  : "text-slate-500 dark:text-slate-400 hover:text-eco-500 dark:hover:text-eco-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="w-5 h-5 mb-1" aria-hidden="true" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </footer>
    </div>
  );
}

export default App;
