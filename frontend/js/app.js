// API endpoint
const API_URL = 'http://127.0.0.1:8000';

// DOM Elements
const claimForm = document.getElementById('claim-form');
const claimInput = document.getElementById('claim-input');
const submitBtn = document.getElementById('submit-btn');
const resultsSection = document.getElementById('results-section');
const loader = document.querySelector('.loader');
const resultClaim = document.getElementById('result-claim');
const verdictContainer = document.getElementById('verdict-container');
const evidenceContainer = document.getElementById('evidence-container');

// Event Listeners
claimForm.addEventListener('submit', handleSubmit);

// Prevent submission with empty claim
claimInput.addEventListener('input', () => {
    submitBtn.disabled = !claimInput.value.trim();
});

// Initial state
submitBtn.disabled = true;

/**
 * Handle the form submission
 * @param {Event} event - The submit event
 */
async function handleSubmit(event) {
    event.preventDefault();

    // Get the claim text
    const claimText = claimInput.value.trim();
    if (!claimText) return;

    // Show loader and results section
    resultsSection.classList.remove('hidden');
    loader.classList.remove('hidden');

    // Clear previous results
    resultClaim.textContent = '';
    verdictContainer.innerHTML = '';
    evidenceContainer.innerHTML = '';

    try {
        // Call the API
        const response = await verifyClaimAPI(claimText);

        // Process and display the results
        displayResults(response);
    } catch (error) {
        // Handle errors
        displayError(error.message);
    } finally {
        // Hide loader
        loader.classList.add('hidden');
    }
}

/**
 * Call the VeriFact API to verify a claim
 * @param {string} text - The text containing the claim
 * @returns {Promise<Object>} The API response
 */
async function verifyClaimAPI(text) {
    try {
        const response = await fetch(`${API_URL}/verify-claim/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error calling the API:', error);
        throw error;
    }
}

/**
 * Display the verification results
 * @param {Object} data - The API response data
 */
function displayResults(data) {
    // Display the extracted claim
    resultClaim.textContent = data.claim || 'No claim detected';

    // Process and display the verdict
    processVerdict(data.verdict);

    // Display the evidence
    processEvidence(data.retrieved_documents);
}

/**
 * Process and display the verdict from the API
 * @param {string} verdict - The raw verdict text from the API
 */
function processVerdict(verdict) {
    // Remove any internal thinking markers if present (e.g., <think>...</think>)
    let cleanVerdict = verdict.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Create the verdict HTML
    let verdictHTML = '';

    // Check for standard verdict formats
    if (cleanVerdict.includes('Verdict:')) {
        // Extract verdict status for styling
        let status = '';
        if (cleanVerdict.toLowerCase().includes('supported')) {
            status = 'supported';
        } else if (cleanVerdict.toLowerCase().includes('refuted')) {
            status = 'refuted';
        } else {
            status = 'uncertain';
        }

        // Format the verdict with proper styling
        verdictHTML = `<div class="${status}">
            ${formatVerdictText(cleanVerdict)}
        </div>`;
    } else {
        // If the verdict isn't in the expected format, display as is
        verdictHTML = `<div>${cleanVerdict}</div>`;
    }

    // Insert into the container
    verdictContainer.innerHTML = verdictHTML;
}

/**
 * Format the verdict text with proper line breaks and styling
 * @param {string} text - The verdict text
 * @returns {string} HTML-formatted verdict text
 */
function formatVerdictText(text) {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            if (line.startsWith('Verdict:')) {
                return `<h4>${line}</h4>`;
            } else if (line.startsWith('Explanation:')) {
                return `<p><strong>${line}</strong></p>`;
            } else if (line.startsWith('Sources:')) {
                return `<p><em>${line}</em></p>`;
            } else {
                return `<p>${line}</p>`;
            }
        })
        .join('');
}

/**
 * Process and display the evidence from the API
 * @param {Array<string>} documents - The evidence documents
 */
function processEvidence(documents) {
    if (!documents || documents.length === 0) {
        evidenceContainer.innerHTML = '<p>No evidence found.</p>';
        return;
    }

    // Create an HTML item for each evidence document
    const evidenceHTML = documents.map((doc, index) => `
        <div class="evidence-item">
            <p>${doc}</p>
        </div>
    `).join('');

    // Insert into the container
    evidenceContainer.innerHTML = evidenceHTML;
}

/**
 * Display an error message
 * @param {string} message - The error message
 */
function displayError(message) {
    verdictContainer.innerHTML = `
        <div class="refuted">
            <h4>Error</h4>
            <p>Something went wrong: ${message}</p>
            <p>Please try again later.</p>
        </div>
    `;

    evidenceContainer.innerHTML = '<p>No evidence available due to an error.</p>';
}
