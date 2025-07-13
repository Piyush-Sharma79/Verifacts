import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// API endpoint
const API_URL = 'https://f84309bafbdb.ngrok-free.app';

// Example facts users can try
const EXAMPLE_FACTS = [
  "The Eiffel Tower is 330 meters tall.",
  "Big Ben is the name of the clock tower in London.",
  "The Statue of Liberty was a gift from France to the United States.",
  "The Great Wall of China is visible from space.",
  "Mount Everest is the tallest mountain in the world."
];

// Enhanced interfaces for the new API response format
interface DocumentMetadata {
  source?: string;
  filename?: string;
  source_type?: string;
  created_at?: string;
}

interface Document {
  content: string;
  source: string;
  source_type: string;
  similarity: number;
  metadata?: DocumentMetadata;
}

interface VerdictInfo {
  raw?: string;
  verdict: string;
  explanation: string;
  sources?: string;
  confidence: string;
  timestamp?: string;
}

interface VerificationResult {
  claim: string;
  verdict: VerdictInfo;
  retrieved_documents: Document[];
  process_time?: number;
}

// Knowledge stats interface
interface KnowledgeStats {
  total_documents: number;
  source_types: Record<string, number>;
}

// Workflow steps
const WORKFLOW_STEPS = [
  { id: 'input', label: 'Input Analysis', description: 'Extracting factual claims from your input', icon: 'check_circle' },
  { id: 'embedding', label: 'Vector Embedding', description: 'Converting claim to numerical vectors', icon: 'transform' },
  { id: 'retrieval', label: 'Knowledge Retrieval', description: 'Searching Knowledge Base for information', icon: 'search' },
  { id: 'analysis', label: 'Evidence Analysis', description: 'Analyzing evidence against the claim', icon: 'analytics' },
  { id: 'llm', label: 'LLM Processing', description: 'Qwen3 processes evidence and claim', icon: 'psychology' },
  { id: 'verdict', label: 'Verdict Generation', description: 'Generating a final verification verdict', icon: 'gavel' }
];

function App() {
  const [claimText, setClaimText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [knowledgeStats, setKnowledgeStats] = useState<KnowledgeStats | null>(null);

  // Refs for scrolling
  const processRef = React.useRef<HTMLDivElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Fetch knowledge base stats on component mount
  useEffect(() => {
    fetch(`${API_URL}/knowledge-stats/`)
      .then(response => response.json())
      .then(data => setKnowledgeStats(data as KnowledgeStats))
      .catch(err => console.error("Failed to load knowledge stats:", err));
  }, []);

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

    // Use setTimeout to ensure DOM updates before scrolling
    setTimeout(() => {
      if (processRef.current) {
        processRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    try {
      // Simulate the workflow steps with timing
      setActiveStep('input');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCompletedSteps(prev => [...prev, 'input']);

      setActiveStep('embedding');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCompletedSteps(prev => [...prev, 'embedding']);

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
              setActiveStep('llm');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setCompletedSteps(prev => [...prev, 'llm']);

        setActiveStep('verdict');
        const data = await response.json();
        await new Promise(resolve => setTimeout(resolve, 1000));

        setResult(data);
        setCompletedSteps(prev => [...prev, 'verdict']);

      // After results are in, scroll to results section
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
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
  const processVerdict = (verdict: string | VerdictInfo) => {
    // If verdict is a string (old format), clean it up
    if (typeof verdict === 'string') {
      return verdict.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }

    // Otherwise, it's already the new structured format
    return verdict;
  };

  // Format verdict text with proper styling
  const formatVerdictText = (verdict: string | VerdictInfo) => {
    // Handle string format (backward compatibility)
    if (typeof verdict === 'string') {
      return verdict
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
    }

    // Handle new structured format
    const elements = [];

    // Add verdict
    elements.push(
      <h4 key="verdict" className="text-xl font-bold mb-3">
        Verdict: {verdict.verdict}
      </h4>
    );

    // Add explanation
    elements.push(
      <p key="explanation" className="font-medium mb-3">
        <span className="font-bold">Explanation:</span> {verdict.explanation}
      </p>
    );

    // Add sources if available
    if (verdict.sources) {
      elements.push(
        <p key="sources" className="text-sm italic text-slate-600 mt-2">
          <span className="font-bold">Sources:</span> {verdict.sources}
        </p>
      );
    }

    return elements;
  };

  // Determine verdict status for styling
  const getVerdictStatus = (verdict: string | VerdictInfo) => {
    const verdictText = typeof verdict === 'string' ? verdict.toLowerCase() : verdict.verdict.toLowerCase();

    if (verdictText.includes('supported')) return 'verdict-supported';
    if (verdictText.includes('refuted')) return 'verdict-refuted';
    if (verdictText.includes('not enough')) return 'verdict-uncertain';
    return 'verdict-uncertain'; // uncertain
  };

  // Get confidence indicator class
  const getConfidenceClass = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format document for display
  const formatDocument = (doc: string | Document, index: number) => {
    // Handle string format (backward compatibility)
    if (typeof doc === 'string') {
      return (
        <div key={index} className="bg-[var(--bg-color)] p-4 rounded-2xl neumorphic-shadow-inset">
          <div className="flex items-center mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Source {index + 1}</span>
          </div>
          {doc}
        </div>
      );
    }

    // Handle structured document format
    const sourceType = doc.source_type || 'unknown';
    let sourceIcon = '📄';
    let sourceTypeClass = 'bg-gray-200 text-gray-600';

    if (sourceType === 'wikipedia') {
      sourceIcon = '📚';
      sourceTypeClass = 'bg-blue-100 text-blue-800';
    } else if (sourceType === 'news') {
      sourceIcon = '📰';
      sourceTypeClass = 'bg-purple-100 text-purple-800';
    }

    return (
      <div key={index} className="bg-[var(--bg-color)] p-4 rounded-2xl neumorphic-shadow-inset">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">Source {index + 1}</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${sourceTypeClass}`}>
              {sourceIcon} {sourceType}
            </span>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            Similarity: {doc.similarity.toFixed(2)}
          </span>
        </div>

        <div className="text-xs text-[var(--text-secondary)] mb-3 truncate">
          Source: {doc.source}
        </div>

        <div className="mt-2 border-t border-[var(--neutral-light)] pt-3 text-[var(--text-primary)] leading-relaxed">
          {doc.content}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] antialiased">
      <style>{`
        :root {
            --bg-color: #F4F4F4;
            --card-bg: #FFFFFF;
            --text-primary: #1A1A1A;
            --text-secondary: #6B7280;
            --accent-blue: #3B82F6;
            --accent-green: #10B981;
            --accent-yellow: #F59E0B;
            --accent-red: #EF4444;
            --neutral-light: #E5E7EB;
        }

        .neumorphic-shadow {
            box-shadow: 8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff;
        }

        .neumorphic-shadow-inset {
            box-shadow: inset 8px 8px 16px #d1d1d1, inset -8px -8px 16px #ffffff;
        }

        .btn-primary {
            background-color: var(--accent-blue);
            color: white;
            font-weight: 600;
            padding: 0.75rem 1.5rem;
            border-radius: 9999px;
            transition: all 0.2s ease-in-out;
            box-shadow: 4px 4px 8px #d1d1d1, -4px -4px 8px #ffffff;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 6px 6px 12px #d1d1d1, -6px -6px 12px #ffffff;
        }

        .btn-primary:active {
            transform: translateY(1px);
            box-shadow: inset 4px 4px 8px #2563eb, inset -4px -4px 8px #60a5fa;
        }

        .card {
            background-color: var(--card-bg);
            border-radius: 1.5rem;
            padding: 2rem;
            box-shadow: 12px 12px 24px #d1d1d1, -12px -12px 24px #ffffff;
        }

        .verdict-supported {
            background-color: rgba(16, 185, 129, 0.1);
            border-left: 4px solid var(--accent-green);
        }

        .verdict-refuted {
            background-color: rgba(239, 68, 68, 0.1);
            border-left: 4px solid var(--accent-red);
        }

        .verdict-uncertain {
            background-color: rgba(245, 158, 11, 0.1);
            border-left: 4px solid var(--accent-yellow);
        }

        .process-icon-spin {
            animation: spin 10s linear infinite;
        }

        @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        .flow-connector {
            height: 2px;
            background: linear-gradient(to right, #e5e7eb, #3B82F6, #e5e7eb);
            position: relative;
            z-index: 1;
            transform: translateY(40px);
        }

        .flow-node {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
            transition: all 0.3s ease;
        }

        .flow-node-active {
            transform: scale(1.1);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
        }

        .flow-node-inner {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
      `}</style>

      <div className="container mx-auto px-4 py-12">
        <header className="flex flex-col space-y-6 mb-24">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-white text-xl font-bold">VF</div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">VeriFact</h1>
            </div>
            <div className="flex items-center space-x-4 text-sm font-medium">
              <div className="flex items-center space-x-2 text-[var(--text-secondary)]">
                <div className="w-3 h-3 rounded-full bg-[var(--accent-green)] animate-pulse"></div>
                <span>AI System Active</span>
              </div>
              {knowledgeStats && (
                <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                  {knowledgeStats.total_documents || 0} documents in knowledge base
                </div>
              )}
            </div>
          </div>

          <nav className="flex justify-center space-x-8 border-b border-[var(--neutral-light)] pb-4">
            <a href="#fact-checker" className="text-[var(--accent-blue)] font-medium hover:opacity-80 flex items-center space-x-2">
              <span className="material-icons text-sm">fact_check</span>
              <span>Fact Checker</span>
            </a>
            <a href="#how-it-works" className="text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors flex items-center space-x-2">
              <span className="material-icons text-sm">info</span>
              <span>How It Works</span>
            </a>
            <a href="#about" className="text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors flex items-center space-x-2">
              <span className="material-icons text-sm">emoji_events</span>
              <span>Hackathon</span>
            </a>
          </nav>
        </header>

        <main className="space-y-24">
          <section className="relative" id="fact-checker">
            <div className="absolute -top-12 -left-12 text-6xl opacity-20 transform -rotate-12">🧐</div>
            <div className="absolute -top-24 -right-16 text-6xl opacity-20 transform rotate-12">🔍</div>
            <div className="absolute -bottom-12 -right-12 text-6xl opacity-20 transform rotate-12">🤔</div>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-5xl font-extrabold text-[var(--text-primary)] mb-4">Uncover the Truth.</h2>
              <p className="text-lg text-[var(--text-secondary)] mb-8">Just type a claim, and our AI will search, analyze, and deliver a verdict in seconds.</p>
            </div>

            <div className="card max-w-3xl mx-auto">
              <form onSubmit={handleSubmit}>
                <textarea
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  className="w-full h-36 p-6 bg-[var(--bg-color)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] neumorphic-shadow-inset text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none"
                  placeholder="e.g., The Amazon rainforest produces 20% of Earth's oxygen supply..."
                  required
                />

                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  {EXAMPLE_FACTS.map((fact, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setExampleFact(fact)}
                      className="bg-[#E0E5EC] hover:bg-[#c8cdd3] text-sm text-[var(--text-secondary)] font-medium py-2 px-4 rounded-full transition-colors"
                      style={{ boxShadow: '3px 3px 6px #d1d1d1, -3px -3px 6px #ffffff' }}
                    >
                      {fact.length > 30 ? fact.substring(0, 30) + '...' : fact}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center mt-8">
                  <button
                    type="submit"
                    className="btn-primary text-lg px-8 py-4 flex items-center space-x-2"
                    disabled={isLoading || !claimText.trim()}
                  >
                    {isLoading ? (
                      <>
                        <div className="relative w-6 h-6 mr-3">
                          <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full"></div>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs">⚡</div>
                        </div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-icons">fact_check</span>
                        <span>Verify Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" ref={processRef} className={!isLoading && !result ? "pt-16" : ""}>
            <div className="card relative overflow-hidden">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-2">How It Works</h2>
                <p className="text-[var(--text-secondary)]">Our AI follows a meticulous process to ensure accuracy and transparency.</p>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative px-8">
                {WORKFLOW_STEPS.map((step, index) => {
                  const isActive = activeStep === step.id;
                  const isCompleted = completedSteps.includes(step.id);
                  const isLast = index === WORKFLOW_STEPS.length - 1;

                  // Color based on state
                  const nodeColor = isActive ? 'text-blue-500 border-blue-500' :
                                   isCompleted ? 'text-green-500 border-green-500' :
                                   'text-gray-400 border-gray-300';

                  return (
                    <div key={step.id} className="flex flex-col items-center mb-8 md:mb-0 relative z-10">
                      <div className={`flow-node ${isActive ? 'flow-node-active' : ''}`}>
                        <div className={`flow-node-inner border-2 ${nodeColor}`}>
                          {isCompleted ? (
                            <span className="material-icons text-green-500">check_circle</span>
                          ) : isActive ? (
                            <span className="material-icons text-blue-500 animate-spin" style={{ animationDuration: '3s' }}>autorenew</span>
                          ) : (
                            <span className="material-icons text-gray-400">{step.icon}</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 text-center w-39">
                        <p className={`font-semibold ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                      </div>

                      {!isLast && (
                        <div className="hidden md:block absolute top-7 left-[70px] w-[calc(100%+30px)] h-[2px]">
                          <div className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-gray-300'} transition-all duration-500`}></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {result?.process_time && (
                <div className="text-center mt-8 text-sm text-[var(--text-secondary)]">
                  Process completed in {result.process_time.toFixed(2)} seconds
                </div>
              )}
            </div>
          </section>

          {/* Results Section with ref */}
          {result && !isLoading && (
            <section id="results" ref={resultsRef}>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Analysis Result</h2>
                {result.process_time && (
                  <p className="text-md text-[var(--text-secondary)]">Process completed in {result.process_time.toFixed(2)} seconds</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="card">
                    <h3 className="font-semibold text-[var(--text-secondary)] mb-2 text-sm uppercase tracking-wider">Claim</h3>
                    <p className="text-lg font-medium text-[var(--text-primary)]">{result.claim}</p>
                  </div>

                  <div className="card relative overflow-hidden">
                    <div className="absolute -top-5 -right-5 text-5xl opacity-10">📜</div>
                    <h3 className="font-semibold text-[var(--text-secondary)] mb-2 text-sm uppercase tracking-wider">Verdict</h3>

                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`text-2xl font-bold ${
                        result.verdict.verdict.toLowerCase().includes('supported') ? 'text-[var(--accent-green)]' :
                        result.verdict.verdict.toLowerCase().includes('refuted') ? 'text-[var(--accent-red)]' :
                        'text-[var(--accent-yellow)]'
                      }`}>
                        {result.verdict.verdict}
                      </span>

                      {result.verdict.confidence && (
                        <span className={`${getConfidenceClass(result.verdict.confidence)} text-xs font-semibold px-3 py-1 rounded-full`}>
                          {result.verdict.confidence.charAt(0).toUpperCase() + result.verdict.confidence.slice(1)} Confidence
                        </span>
                      )}
                    </div>

                    <p className="text-[var(--text-secondary)]">{result.verdict.explanation}</p>
                  </div>
                </div>

                <div className="lg:col-span-3 card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Evidence</h3>
                    <span className="text-sm text-[var(--text-secondary)]">{result.retrieved_documents?.length || 0} sources found</span>
                  </div>

                  <div className="space-y-6">
                    {result.retrieved_documents && result.retrieved_documents.length > 0 ? (
                      result.retrieved_documents.map((doc, index) => formatDocument(doc, index))
                    ) : (
                      <p className="text-[var(--text-secondary)]">No evidence found.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {error && (
            <section className="max-w-3xl mx-auto">
              <div className="card bg-red-50 border-l-4 border-red-500">
                <h3 className="font-bold text-lg mb-2 text-red-700">Error</h3>
                <p className="text-red-600">{error}</p>
                <p className="mt-2 text-sm text-red-500">Please check your connection and try again.</p>
              </div>
            </section>
          )}

          {/* Architecture Explanation Section */}
          <section id="architecture" className="pt-12">
            <div className="card">
              <h2 className="text-3xl font-bold text-center mb-6">Understanding How VeriFact Works</h2>
              <p className="text-[var(--text-secondary)] text-center mb-10">Explore the technical architecture behind our fact-checking system</p>

              <div className="flex flex-col space-y-12">
                {/* RAG Explanation */}
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="md:w-1/3">
                    <div className="rounded-xl bg-blue-50 p-6 text-center neumorphic-shadow">
                      <span className="material-icons text-6xl text-blue-500 mb-3">psychology</span>
                      <h3 className="text-xl font-bold mb-2">RAG Architecture</h3>
                      <p className="text-sm">Retrieval-Augmented Generation for accurate, verifiable answers</p>
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <h4 className="text-lg font-semibold text-[var(--accent-blue)] mb-3">Our Custom RAG Pipeline</h4>
                    <p className="mb-3">VeriFact uses Retrieval-Augmented Generation (RAG) to ground AI responses in factual evidence rather than relying solely on the LLM's knowledge.</p>
                    <p>When you submit a claim, our system:</p>
                    <ol className="list-decimal pl-5 space-y-2 mt-2">
                      <li>Extracts the factual claim using spaCy NLP</li>
                      <li>Converts the claim to a vector embedding using SentenceTransformers</li>
                      <li>Searches our FAISS index for semantically similar document chunks</li>
                      <li>Retrieves relevant evidence from Wikipedia and news sources</li>
                      <li>Sends both the claim and evidence to our Qwen3 LLM</li>
                      <li>Generates a verdict based on the retrieved evidence</li>
                    </ol>
                  </div>
                </div>

                {/* Vector Search Explanation */}
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="md:w-1/3 md:order-last">
                    <div className="rounded-xl bg-purple-50 p-6 text-center neumorphic-shadow">
                      <span className="material-icons text-6xl text-purple-500 mb-3">dataset</span>
                      <h3 className="text-xl font-bold mb-2">Vector Search</h3>
                      <p className="text-sm">Finding semantically similar information using FAISS</p>
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <h4 className="text-lg font-semibold text-purple-600 mb-3">Semantic Search with FAISS</h4>
                    <p className="mb-3">Traditional keyword search wouldn't understand that "How tall is the Eiffel Tower?" and "The height of the Eiffel Tower" are asking for the same information. Vector search solves this by understanding semantic meaning.</p>
                    <p className="mb-3">Our system uses Facebook AI Similarity Search (FAISS) to efficiently find information by:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Converting text into numerical vectors that capture meaning</li>
                      <li>Organizing vectors in a searchable index for quick retrieval</li>
                      <li>Finding the closest matching vectors when searching</li>
                      <li>Retrieving the original text chunks associated with those vectors</li>
                    </ul>
                    <p className="mt-2 text-sm italic">This allows us to find relevant information even when the wording is different from the original source.</p>
                  </div>
                </div>

                {/* Document Chunking */}
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="md:w-1/3">
                    <div className="rounded-xl bg-green-50 p-6 text-center neumorphic-shadow">
                      <span className="material-icons text-6xl text-green-500 mb-3">snippet_folder</span>
                      <h3 className="text-xl font-bold mb-2">Document Chunking</h3>
                      <p className="text-sm">Breaking documents into searchable pieces</p>
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <h4 className="text-lg font-semibold text-green-600 mb-3">Smart Document Processing</h4>
                    <p className="mb-3">Long documents like Wikipedia articles contain too much information to process at once. Our system splits them into smaller, manageable chunks that:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Contain focused information on specific topics</li>
                      <li>Are the right size for embedding models (512 characters)</li>
                      <li>Overlap slightly (50 characters) to avoid breaking context</li>
                      <li>Can be individually retrieved based on relevance to the query</li>
                    </ul>
                    <p className="mt-2">This approach allows us to precisely target information within large documents and provide focused, relevant evidence.</p>
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="bg-[var(--bg-color)] p-6 rounded-xl neumorphic-shadow-inset">
                  <h4 className="text-lg font-semibold mb-4 text-center">Technology Stack</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white p-3 rounded-lg neumorphic-shadow">
                      <span className="text-3xl">🐍</span>
                      <p className="font-medium mt-1">Python / FastAPI</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg neumorphic-shadow">
                      <span className="text-3xl">🔍</span>
                      <p className="font-medium mt-1">FAISS</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg neumorphic-shadow">
                      <span className="text-3xl">🧠</span>
                      <p className="font-medium mt-1">Qwen3 LLM</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg neumorphic-shadow">
                      <span className="text-3xl">⚡</span>
                      <p className="font-medium mt-1">React</p>
                    </div>
                  </div>
                </div>

                {/* Try It Button */}
                <div className="text-center mt-12">
                  <p className="text-[var(--text-secondary)] mb-4">Ready to see VeriFact in action?</p>
                  <a href="#fact-checker" className="btn-primary inline-flex items-center space-x-2">
                    <span className="material-icons">play_arrow</span>
                    <span>Try It Now</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

                {/* Hackathon Information Section */}
        <section id="about" className="pt-24">
          <div className="card">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-[var(--accent-blue)] text-white text-3xl font-bold h-16 w-16 rounded-full flex items-center justify-center mr-3">VF</div>
              <h2 className="text-4xl font-bold">VeriFact</h2>
            </div>

            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold mb-2">Real-Time AI Fact-Checker Powered by RAG</h3>
              <p className="text-[var(--text-secondary)]">DeepDive 1.0 – Round 2: Reliable Knowledge – Fact-Checking & Research</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-bold mb-3 text-[var(--accent-blue)]">The Problem</h4>
                <p className="text-[var(--text-secondary)] mb-4">
                  The constant stream of content across social media and digital news platforms increases exposure to
                  misinformation. Readers often encounter viral claims without a convenient way to verify them. Manual fact-checking
                  is time-intensive and inaccessible for most users.
                </p>

                <h4 className="text-xl font-bold mb-3 text-[var(--accent-blue)]">Our Solution</h4>
                <p className="text-[var(--text-secondary)] mb-4">
                  VeriFact is a real-time AI chatbot that identifies and verifies factual claims in user-submitted content. Using
                  Retrieval-Augmented Generation (RAG), it analyzes the input, searches reliable sources such as Wikipedia
                  and news APIs, and returns a concise verdict backed by references.
                </p>

                <h4 className="text-xl font-bold mb-3 text-[var(--accent-blue)]">Impact</h4>
                <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-1">
                  <li>Makes fact-checking accessible and instant for any reader or user</li>
                  <li>Encourages responsible content sharing by offering real-time evidence</li>
                  <li>Scales across use cases including journalism, social media, and education</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-bold mb-3 text-[var(--accent-blue)]">Key Features</h4>
                <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-2 mb-6">
                  <li>Named Entity and Claim Extraction</li>
                  <li>LangChain-driven RAG pipeline using FAISS vector storage</li>
                  <li>Qwen3 reasoning engine for verdicts</li>
                  <li>Evidence display with source citations</li>
                  <li>Confidence indicators when evidence is weak, contradictory, or missing</li>
                </ul>

                <h4 className="text-xl font-bold mb-3 text-[var(--accent-blue)]">Technology Stack</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--bg-color)] p-3 rounded-lg neumorphic-shadow-inset">
                    <p className="font-bold text-sm">Frontend</p>
                    <p className="text-sm text-[var(--text-secondary)]">React with TailwindCSS</p>
                  </div>
                  <div className="bg-[var(--bg-color)] p-3 rounded-lg neumorphic-shadow-inset">
                    <p className="font-bold text-sm">Backend</p>
                    <p className="text-sm text-[var(--text-secondary)]">FastAPI (Python)</p>
                  </div>
                  <div className="bg-[var(--bg-color)] p-3 rounded-lg neumorphic-shadow-inset">
                    <p className="font-bold text-sm">LLM Engine</p>
                    <p className="text-sm text-[var(--text-secondary)]">Qwen3 via Ollama</p>
                  </div>
                  <div className="bg-[var(--bg-color)] p-3 rounded-lg neumorphic-shadow-inset">
                    <p className="font-bold text-sm">Retrieval</p>
                    <p className="text-sm text-[var(--text-secondary)]">FAISS with LangChain</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center mt-24 text-sm text-[var(--text-secondary)] space-y-1">
          <p>Built for the 2025 AI Hackathon</p>
          {knowledgeStats && knowledgeStats.source_types && (
            <p>
              Wikipedia: {knowledgeStats.source_types['wikipedia'] || 0} documents &nbsp;•&nbsp;
              News: {knowledgeStats.source_types['news'] || 0} documents
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}

export default App;
