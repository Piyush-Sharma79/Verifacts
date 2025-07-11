import { useState, useEffect } from 'react';
import './App.css';

// API endpoint
const API_URL = 'http://127.0.0.1:8001';

// Example facts users can try
const EXAMPLE_FACTS = [
  "The Eiffel Tower is 330 meters tall.",
  "Big Ben is the name of the clock tower in London.",
  "The Statue of Liberty was a gift from France to the United States.",
  "The Great Wall of China is visible from space.",
  "Mount Everest is the tallest mountain in the world."
];

interface VerificationResult {
  claim: string;
  verdict: string;
  retrieved_documents: string[];
}

// Workflow steps
const WORKFLOW_STEPS = [
  { id: 'input', label: 'Input Analysis', description: 'Extracting factual claims from your input' },
  { id: 'retrieval', label: 'Knowledge Retrieval', description: 'Searching our knowledge base for relevant information' },
  { id: 'analysis', label: 'Evidence Analysis', description: 'Analyzing evidence against the claim' },
  { id: 'verdict', label: 'Verdict Generation', description: 'Generating a final verification verdict' }
];

function App() {
  const [claimText, setClaimText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Reset workflow when result changes
  useEffect(() => {
    if (!isLoading && result) {
      setCompletedSteps(WORKFLOW_STEPS.map(step => step.id));
      setActiveStep(null);
    }
  }, [result, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!claimText.trim()) return;

    // Reset states
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCompletedSteps([]);

    try {
      // Simulate the workflow steps with timing
      setActiveStep('input');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCompletedSteps(prev => [...prev, 'input']);

      setActiveStep('retrieval');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCompletedSteps(prev => [...prev, 'retrieval']);

      setActiveStep('analysis');

      // Make the actual API call
      const response = await fetch(`${API_URL}/verify-claim/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: claimText }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      setCompletedSteps(prev => [...prev, 'analysis']);
      setActiveStep('verdict');

      const data = await response.json();
      await new Promise(resolve => setTimeout(resolve, 1000));

      setResult(data);
      setCompletedSteps(prev => [...prev, 'verdict']);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setActiveStep(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Set example fact
  const setExampleFact = (fact: string) => {
    setClaimText(fact);
  };

  // Process verdict to remove thinking process and format
  const processVerdict = (verdict: string) => {
    // Remove any internal thinking markers if present (e.g., <think>...</think>)
    return verdict.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  };

  // Format verdict text with proper styling
  const formatVerdictText = (text: string) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, index) => {
        if (line.startsWith('Verdict:')) {
          return <h4 key={index} className="text-xl font-bold mb-3">{line}</h4>;
        } else if (line.startsWith('Explanation:')) {
          return <p key={index} className="font-medium mb-3" dangerouslySetInnerHTML={{ __html: line.replace('Explanation:', '<span class="font-bold">Explanation:</span>') }} />;
        } else if (line.startsWith('Sources:')) {
          return <p key={index} className="text-sm italic text-slate-600 mt-2">{line}</p>;
        } else {
          return <p key={index} className="mb-2">{line}</p>;
        }
      });
  };

  // Determine verdict status for styling
  const getVerdictStatus = (verdict: string) => {
    const lowerVerdict = verdict.toLowerCase();
    if (lowerVerdict.includes('supported')) return 'supported';
    if (lowerVerdict.includes('refuted')) return 'refuted';
    return 'uncertain'; // uncertain
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">Veri</span>Fact
            </h1>
            <p className="text-blue-200 text-sm">AI-powered real-time fact checking</p>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs text-blue-200">AI System Active</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-10 max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-400 mb-2">Verify a Claim</h2>
              <p className="text-slate-300">
                Enter a statement below and our AI will check its accuracy against reliable sources.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                <span className="mr-1">⚡</span> Powered by RAG + LLM
              </span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
            <form onSubmit={handleSubmit} className="p-6">
              <textarea
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="Enter a statement to verify... (e.g., 'The Eiffel Tower is 330 meters tall.')"
                className="w-full min-h-32 p-4 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500"
                required
              />

              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-2">Try one of these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_FACTS.map((fact, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setExampleFact(fact)}
                      className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 transition-colors"
                    >
                      {fact.length > 30 ? fact.substring(0, 30) + '...' : fact}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isLoading || !claimText.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>Verify</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Workflow Visualization */}
        {(isLoading || result) && (
          <section className="mb-10 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-blue-400 mb-4">Verification Process</h3>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                {WORKFLOW_STEPS.map((step, index) => {
                  const isActive = activeStep === step.id;
                  const isCompleted = completedSteps.includes(step.id);
                  const isLast = index === WORKFLOW_STEPS.length - 1;

                  return (
                    <div key={step.id} className="flex flex-col items-center relative mb-4 md:mb-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300
                          ${isActive ? 'bg-blue-500 text-white scale-110' :
                            isCompleted ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'}`}
                      >
                        {isCompleted ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div className="text-center mt-2">
                        <p className={`font-medium ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-500 max-w-[120px] mt-1">{step.description}</p>
                      </div>
                      {!isLast && (
                        <div className="hidden md:block absolute top-5 left-[60px] w-[calc(100%-30px)] h-0.5 bg-slate-700">
                          <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: isCompleted ? '100%' : '0%' }}
                          ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {error && (
          <section className="max-w-3xl mx-auto">
            <div className="bg-red-900/30 border border-red-800 text-red-300 px-6 py-5 rounded-lg animate-fade-in">
              <h3 className="font-bold text-lg mb-2">Error</h3>
              <p>{error}</p>
              <p className="mt-2 text-sm">Please check your connection and try again.</p>
            </div>
          </section>
        )}

        {result && !isLoading && (
          <section className="max-w-3xl mx-auto animate-fade-in">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
                <div className="border-b border-slate-700 px-6 py-4 bg-slate-800/50">
                  <h3 className="text-lg font-bold text-blue-400">Claim</h3>
                </div>
                <div className="p-6">
                  <p className="text-lg">{result.claim || 'No claim detected'}</p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
                <div className="border-b border-slate-700 px-6 py-4 bg-slate-800/50">
                  <h3 className="text-lg font-bold text-blue-400">Verdict</h3>
                </div>
                <div className={`p-6 ${getVerdictStatus(result.verdict)}`}>
                  <div className="whitespace-pre-line">
                    {formatVerdictText(processVerdict(result.verdict))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
                <div className="border-b border-slate-700 px-6 py-4 bg-slate-800/50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-blue-400">Evidence</h3>
                  <span className="text-xs text-slate-400">{result.retrieved_documents?.length || 0} sources</span>
                </div>
                <div className="p-6">
                  <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
                    {result.retrieved_documents && result.retrieved_documents.length > 0 ? (
                      result.retrieved_documents.map((doc, index) => (
                        <div key={index} className="bg-slate-900 p-4 rounded-lg text-sm border border-slate-700 hover:border-slate-600 transition-colors">
                          <div className="flex items-center mb-2">
                            <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded">Source {index + 1}</span>
                          </div>
                          {doc}
                        </div>
                      ))
                    ) : (
                      <p>No evidence found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-slate-900 py-6 mt-10 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p className="text-sm">Built for the 2025 AI Hackathon</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
