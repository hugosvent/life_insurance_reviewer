
// Initialize API configuration when the page loads
let configInitialized = false;
(async function initializeApp() {
    await API_CONFIG.init();
    configInitialized = true;
    console.log('API configuration initialized:', API_CONFIG.BASE_URL);
})();

// Helper function to ensure config is initialized before API calls
async function ensureConfigReady() {
    while (!configInitialized) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// DOM Elements
const uploadView = document.getElementById('upload-view');
const processingView = document.getElementById('processing-view');
const analysisView = document.getElementById('analysis-view');
const errorView = document.getElementById('error-view');

const fileUploadInput = document.getElementById('file-upload');

const selectedFileNameContainer = document.getElementById('selected-file-name');
const languageSelect = document.getElementById('language-select');

// New elements for multiple file support
const selectedFilesContainer = document.getElementById('selected-files-container');
const selectedFilesList = document.getElementById('selected-files-list');
const actionButtons = document.getElementById('action-buttons');
const analyzeButton = document.getElementById('analyze-button');
const clearFilesButton = document.getElementById('clear-files-button');
const uploadButtonText = document.getElementById('upload-button-text');
const analyzeButtonText = document.getElementById('analyze-button-text');
const overviewTabText = document.getElementById('overview-tab-text');

const multiModelResultsDiv = document.getElementById('multi-model-results');


const rawFileContentPre = document.getElementById('raw-file-content');
const rawFileContentContainer = document.getElementById('raw-file-content-container');
const processingMessage = document.getElementById('processing-message');

const errorMessageP = document.getElementById('error-message');
const tryAgainBtn = document.getElementById('try-again-btn');
const invalidLlmResponseDiv = document.getElementById('raw-llm-response');
const invalidLlmResponseContainer = document.getElementById('invalid-llm-response-container');

const passwordModal = document.getElementById('password-modal');
const pdfPasswordInput = document.getElementById('pdf-password-input');
const submitPasswordBtn = document.getElementById('submit-password-btn');
const cancelPasswordBtn = document.getElementById('cancel-password-btn');
const passwordErrorMessage = document.getElementById('password-error-message');

// Privacy Modal Elements
const privacyModal = document.getElementById('privacy-modal');
const privacyAcceptBtn = document.getElementById('privacy-accept-btn');
const privacyDeclineBtn = document.getElementById('privacy-decline-btn');

// Global state variables
let currentView = 'upload';
let currentFiles = [];
let currentAnalysisMode = 'single';

// Function to set the current view
function setView(viewName) {
    uploadView.classList.add('hidden');
    processingView.classList.add('hidden');
    analysisView.classList.add('hidden');
    errorView.classList.add('hidden');

    uploadView.classList.remove('flex-col');
    processingView.classList.remove('flex-col');
    errorView.classList.remove('flex-col');

    switch (viewName) {
        case 'upload':
            uploadView.classList.remove('hidden');
            uploadView.classList.add('flex-col');
            break;
        case 'processing':
            processingView.classList.remove('hidden');
            processingView.classList.add('flex-col');
            break;
        case 'analysis':
            analysisView.classList.remove('hidden');
            invalidLlmResponseContainer.classList.add('hidden');
            break;
        case 'error':
            errorView.classList.remove('hidden');
            errorView.classList.add('flex-col');
            break;
    }
    currentView = viewName;
}

// Function to perform OCR using Tesseract.js
// Enhanced OCR function with image preprocessing
async function ocrPdfPage(pdfPage, pageNum, totalPages) {
    const viewport = pdfPage.getViewport({ scale: OCR_CONFIG.RENDER_SCALE }); // Render at configured scale for better OCR accuracy
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await pdfPage.render({ canvasContext: context, viewport: viewport }).promise;

    processingMessage.textContent = `Performing OCR on page ${pageNum} of ${totalPages}...`;

    // Use optimized Tesseract settings
    const { data: { text } } = await Tesseract.recognize(canvas, 'eng+ind', {
        logger: progress => {
            if (progress.status === 'recognizing text') {
                const progressPercent = Math.round(progress.progress * 100);
                processingMessage.textContent = `Performing OCR on page ${pageNum} of ${totalPages}: ${progressPercent}% complete`;
            }
        },
        // Optimized Tesseract parameters from config
        tessedit_pageseg_mode: Tesseract.PSM[OCR_CONFIG.TESSERACT_OPTIONS.tessedit_pageseg_mode],
        tessedit_ocr_engine_mode: Tesseract.OEM[OCR_CONFIG.TESSERACT_OPTIONS.tessedit_ocr_engine_mode],
        tessedit_parallelize: OCR_CONFIG.TESSERACT_OPTIONS.tessedit_parallelize,
        preserve_interword_spaces: OCR_CONFIG.TESSERACT_OPTIONS.preserve_interword_spaces
    });
    return text;
}

// Function to process PDF content (centralized)
// Enhanced PDF processing function
async function processPdfContent(arrayBuffer, password = null) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error("PDF.js library is not loaded. Please wait or refresh.");
    }
    if (typeof Tesseract === 'undefined') {
        throw new Error("Tesseract.js library is not loaded. Please wait or refresh.");
    }

    let fullText = [];

    let pdf;

    try {
        pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            password: password,
            verbosity: 0 // Reduce console noise
        }).promise;
    } catch (error) {
        if (error.name === 'PasswordException') {
            throw new Error('Password required');
        } else {
            throw error;
        }
    }

    // Validate PDF
    if (!pdf || pdf.numPages < 1) {
        throw new Error('Invalid PDF or no pages found');
    }

    // First pass: extract text using PDF.js
    for (let i = 0; i < pdf.numPages; i++) {
        processingMessage.textContent = `Reading page ${i + 1} of ${pdf.numPages}...`;
        const page = await pdf.getPage(i + 1);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        if (pageText.trim().length < OCR_CONFIG.TEXT_THRESHOLD) {
            processingMessage.textContent = `Preparing OCR for page ${i + 1} of ${pdf.numPages}...`;
            const text = await ocrPdfPage(page, i + 1, pdf.numPages);
            fullText.push(text)
        } else {
            fullText.push(pageText);
        }
    }

    let fileContent = fullText.join('\n\n');

    return fileContent;
}

// New DOM elements for tab-based mode selection
const singleModeTab = document.getElementById('single-mode-tab');
const compareModeTab = document.getElementById('compare-mode-tab');
const modeDescription = document.getElementById('mode-description');

// Function to get current analysis mode
function getCurrentAnalysisMode() {
    return currentAnalysisMode;
}

// New DOM elements for comparison mode
const singleUploadSection = document.getElementById('single-upload-section');
const comparisonUploadSection = document.getElementById('comparison-upload-section');
const fileUpload1 = document.getElementById('file-upload-1');
const fileUpload2 = document.getElementById('file-upload-2');
const file1Display = document.getElementById('file-1-display');
const file2Display = document.getElementById('file-2-display');
const file1Name = document.getElementById('file-1-name');
const file2Name = document.getElementById('file-2-name');
const removeFile1Btn = document.getElementById('remove-file-1');
const removeFile2Btn = document.getElementById('remove-file-2');
const compareButton = document.getElementById('compare-button');
const comparisonActionButtons = document.getElementById('comparison-action-buttons');
const clearComparisonFilesButton = document.getElementById('clear-comparison-files-button');

// Global state for comparison files
let comparisonFiles = { file1: null, file2: null };

// Function to update UI based on analysis mode with enhanced tab styling
function updateUIForMode(mode) {
    currentAnalysisMode = mode;
    
    // Update tab appearance
    if (mode === 'single') {
        singleModeTab.className = 'flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 mode-tab active';
        compareModeTab.className = 'flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 mode-tab inactive border-l border-gray-200';
        
        // Show single upload section, hide comparison section
        singleUploadSection.classList.remove('hidden');
        comparisonUploadSection.classList.add('hidden');
        
        fileUploadInput.removeAttribute('multiple');
        uploadButtonText.textContent = 'Upload Your Policy';
        analyzeButtonText.textContent = 'Analyze Policy';
        overviewTabText.textContent = 'Overview';
        modeDescription.textContent = 'Analyze a single insurance policy in detail';
    } else {
        singleModeTab.className = 'flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 mode-tab inactive border-r border-gray-200';
        compareModeTab.className = 'flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 mode-tab active';
        
        // Show comparison section, hide single upload section
        singleUploadSection.classList.add('hidden');
        comparisonUploadSection.classList.remove('hidden');
        
        overviewTabText.textContent = 'Comparison';
        modeDescription.textContent = 'Upload 2 policies side by side to compare them';
    }
    
    // Clear existing files when mode changes
    clearSelectedFiles();
    clearComparisonFiles();
}

// Function to handle individual file uploads for comparison
function handleComparisonFileUpload(fileInput, fileNumber) {
    fileInput.addEventListener('change', (event) => {
        if (!checkPrivacyConsent()) {
            event.preventDefault();
            event.target.value = '';
            return;
        }

        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            comparisonFiles[`file${fileNumber}`] = file;
            
            // Update display
            const nameElement = document.getElementById(`file-${fileNumber}-name`);
            const displayElement = document.getElementById(`file-${fileNumber}-display`);
            
            nameElement.textContent = file.name;
            nameElement.setAttribute('title', file.name); // Add full filename as tooltip
            displayElement.classList.remove('hidden');
            
            // Check if both files are uploaded
            updateComparisonButtons();
        }
    });
}

// Function to remove comparison files
function removeComparisonFile(fileNumber) {
    comparisonFiles[`file${fileNumber}`] = null;
    const displayElement = document.getElementById(`file-${fileNumber}-display`);
    const fileInput = document.getElementById(`file-upload-${fileNumber}`);
    
    displayElement.classList.add('hidden');
    fileInput.value = '';
    
    updateComparisonButtons();
}

// Function to update comparison buttons visibility
function updateComparisonButtons() {
    const bothFilesUploaded = comparisonFiles.file1 && comparisonFiles.file2;
    const anyFileUploaded = comparisonFiles.file1 || comparisonFiles.file2;
    
    if (bothFilesUploaded) {
        comparisonActionButtons.classList.remove('hidden');
    } else if (anyFileUploaded) {
        comparisonActionButtons.classList.remove('hidden');
        // Show clear button even if only one file is uploaded
    } else {
        comparisonActionButtons.classList.add('hidden');
    }
}

// Function to clear comparison files
function clearComparisonFiles() {
    comparisonFiles = { file1: null, file2: null };
    
    // Clear displays
    file1Display.classList.add('hidden');
    file2Display.classList.add('hidden');
    
    // Clear inputs
    fileUpload1.value = '';
    fileUpload2.value = '';
    
    // Hide action buttons
    comparisonActionButtons.classList.add('hidden');
}

// Function to validate comparison file selection
function validateComparisonFileSelection() {
    if (!comparisonFiles.file1 || !comparisonFiles.file2) {
        alert('Please upload both policies to compare them.');
        return false;
    }
    return true;
}

// Updated initialization function
function initializeModeSelection() {
    singleModeTab.addEventListener('click', () => {
        if (currentAnalysisMode !== 'single') {
            updateUIForMode('single');
        }
    });
    
    compareModeTab.addEventListener('click', () => {
        if (currentAnalysisMode !== 'compare') {
            updateUIForMode('compare');
        }
    });
    
    // Initialize comparison file upload handlers
    handleComparisonFileUpload(fileUpload1, 1);
    handleComparisonFileUpload(fileUpload2, 2);
    
    // Remove file button handlers
    removeFile1Btn.addEventListener('click', () => removeComparisonFile(1));
    removeFile2Btn.addEventListener('click', () => removeComparisonFile(2));
    
    // Compare button handler
    compareButton.addEventListener('click', async () => {
        if (!validateComparisonFileSelection()) {
            return;
        }
        
        const filesToCompare = [comparisonFiles.file1, comparisonFiles.file2];
        await handleMultipleFileUploadProcess(filesToCompare);
    });
    
    // Clear comparison files button handler
    clearComparisonFilesButton.addEventListener('click', () => {
        clearComparisonFiles();
    });
}

// Function to display selected files
function displaySelectedFiles() {
    selectedFilesList.innerHTML = '';
    
    if (currentFiles.length === 0) {
        selectedFilesContainer.classList.add('hidden');
        actionButtons.classList.add('hidden');
        return;
    }
    
    selectedFilesContainer.classList.remove('hidden');
    actionButtons.classList.remove('hidden');
    
    currentFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item flex items-center justify-between p-2 bg-gray-100 rounded border';
        fileItem.innerHTML = `
            <span class="text-sm text-gray-700 truncate flex-1">${file.name}</span>
            <button class="ml-2 text-red-500 hover:text-red-700 text-sm" onclick="removeFile(${index})">
                ✕
            </button>
        `;
        selectedFilesList.appendChild(fileItem);
    });
}

// Function to remove a file
function removeFile(index) {
    currentFiles.splice(index, 1);
    displaySelectedFiles();
}

// Function to clear all selected files
function clearSelectedFiles() {
    currentFiles = [];
    displaySelectedFiles();
    fileUploadInput.value = '';
}

// Function to validate file selection based on mode
function validateFileSelection() {
    if (currentAnalysisMode === 'single' && currentFiles.length > 1) {
        alert('Single policy analysis mode only allows one file. Please switch to comparison mode or remove extra files.');
        return false;
    }
    
    if (currentAnalysisMode === 'compare' && currentFiles.length !== 2) {
        alert('Policy comparison requires exactly 2 files. Please upload exactly 2 policies.');
        return false;
    }
    
    return true;
}

// Modified file upload handler for multiple files
async function handleMultipleFileUploadProcess(files, password = null) {
    try {
        errorMessageP.textContent = '';
        rawFileContentPre.textContent = '';
        invalidLlmResponseDiv.innerHTML = '';
        invalidLlmResponseContainer.classList.add('hidden');

        setView('processing');
        
        const fileContents = [];
        
        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            processingMessage.textContent = `Processing file ${i + 1} of ${files.length}: ${file.name}`;
            
            try {
                const fileContent = await processPdfContent(await file.arrayBuffer(), password);
                fileContents.push({
                    filename: file.name,
                    content: fileContent
                });
            } catch (error) {
                if (error.message === 'Password required') {
                    // Handle password requirement for specific file
                    throw new Error(`Password required for file: ${file.name}`);
                }
                throw new Error(`Error processing ${file.name}: ${error.message}`);
            }
        }

        // Get the selected language
        const selectedLanguage = languageSelect.value;
        const languageNames = {
            'en': 'English',
            'id': 'Bahasa Indonesia',
            'zh': 'Chinese',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'ja': 'Japanese',
            'ko': 'Korean'
        };
        const languageName = languageNames[selectedLanguage] || 'English';
        
        if (currentAnalysisMode === 'single') {
            // Single policy analysis
            analyzeWithLLM(fileContents[0].content, languageName);
        } else {
            // Multiple policy comparison
            compareWithLLM(fileContents, languageName);
        }
        
    } catch (error) {
        console.error("Overall error during file processing or LLM call:", error);
        if (error.message.includes('Password required')) {
            passwordErrorMessage.textContent = error.message;
            passwordModal.classList.remove('hidden');
            setView('processing');
        } else {
            errorMessageP.textContent = `An overall error occurred: ${error.message}. Please try again. For complex PDFs (e.g., scanned documents), a backend OCR service is recommended for optimal results due to client-side limitations.`;
            invalidLlmResponseDiv.innerHTML = '';
            invalidLlmResponseContainer.classList.add('hidden');
            setView('error');
        }
    }
}

async function analyzeWithLLM(fileContent, language) {
    try {
        await ensureConfigReady();
        
        multiModelResultsDiv.innerHTML = `
                    <div class="bg-blue-50 p-3 rounded-lg my-3 border border-blue-200">
                        <div id="thought-process-container" class="mb-4">
                            <div class="flex items-center bg-gray-100 p-3 rounded-lg border border-gray-200">
                                <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#A37F64] mr-2"></div>
                                <h4 class="font-semibold text-gray-700 text-sm">AI Analyzing Document...</h4>
                            </div>
                            <div id="thought-content" class="thought-content-fixed mt-2 text-xs text-gray-600 space-y-2 p-3 bg-gray-50 rounded-b-lg border-l border-r border-b border-gray-200"></div>
                        </div>
                        <div class="mt-2 text-xs text-gray-600 space-y-2 prose max-w-none" id="streaming-content">
                            <p>Preparing analysis...</p>
                        </div>
                    </div>
                `;

        const streamingContent = document.getElementById('streaming-content');
        const thoughtContent = document.getElementById('thought-content');
        const thoughtContainer = document.getElementById('thought-process-container');

        let accumulatedContent = "";
        let thinkContent = "";
        let inThinkBlock = false;
        let thinkingComplete = false;

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANALYZE_POLICY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: fileContent,
                language: language
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error ? errorData.error.message : 'Unknown error'}`);
        }

        // Get the response as a readable stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        // Set view to analysis to show streaming content
        setView('analysis');

        // Process the stream
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk and process it
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim() === '' || !line.startsWith('data: ')) continue;

                const data = line.substring(6); // Remove 'data: ' prefix

                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0].delta.content || "";

                    if (content) {
                        // Handle thought process markers and content streaming
                        if (content.includes('<think>')) {
                            inThinkBlock = true;
                            const thinkStart = content.indexOf('<think>') + 7;
                            thinkContent = content.substring(thinkStart);
                            updateThoughtContent(thoughtContent, thinkContent);
                        } else if (content.includes('</think>')) {
                            inThinkBlock = false;
                            thinkingComplete = true;
                            const thinkEnd = content.indexOf('</think>');
                            if (thinkEnd > 0) {
                                thinkContent = content.substring(0, thinkEnd);
                                updateThoughtContent(thoughtContent, thinkContent);
                            }

                            createCollapsibleThoughtElement(thoughtContainer, thoughtContent);

                            if (thinkEnd + 8 < content.length) {
                                accumulatedContent += content.substring(thinkEnd + 8);
                                streamingContent.innerHTML = accumulatedContent;
                            }
                        } else if (inThinkBlock) {
                            thinkContent += content;
                            updateThoughtContent(thoughtContent, thinkContent);
                        } else {
                            accumulatedContent += content;
                            streamingContent.innerHTML = accumulatedContent;
                        }
                    }
                } catch (error) {
                    console.error("Error parsing chunk:", error, data);
                }
            }
        }

        if (!thinkingComplete) {
            thoughtContainer.classList.add('hidden');
        }

        if (accumulatedContent.includes('Invalid insurance policy input.')) {
            throw new Error('Invalid insurance policy input detected by LLM.');
        }

    } catch (error) {
        console.error("Overall error during file processing or LLM call:", error);
        if (error.message === 'Password required') {
            passwordErrorMessage.textContent = 'This PDF requires a password.';
            passwordModal.classList.remove('hidden');
            setView('processing');
        } else {
            errorMessageP.textContent = `An overall error occurred: ${error.message}. Please try again. For complex PDFs (e.g., scanned documents), a backend OCR service is recommended for optimal results due to client-side limitations.`;
            invalidLlmResponseDiv.innerHTML = '';
            invalidLlmResponseContainer.classList.add('hidden');
            setView('error');
        }
    }
}

// New function for policy comparison
async function compareWithLLM(fileContents, language) {
    try {
        await ensureConfigReady();
        
        multiModelResultsDiv.innerHTML = `
            <div class="bg-blue-50 p-3 rounded-lg my-3 border border-blue-200">
                <div id="thought-process-container" class="mb-4">
                    <div class="flex items-center bg-gray-100 p-3 rounded-lg border border-gray-200">
                        <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#A37F64] mr-2"></div>
                        <h4 class="font-semibold text-gray-700 text-sm">AI Comparing Policies...</h4>
                    </div>
                    <div id="thought-content" class="thought-content-fixed mt-2 text-xs text-gray-600 space-y-2 p-3 bg-gray-50 rounded-b-lg border-l border-r border-b border-gray-200"></div>
                </div>
                <div class="mt-2 text-xs text-gray-600 space-y-2 prose max-w-none" id="streaming-content">
                    <p>Preparing comparison...</p>
                </div>
            </div>
        `;

        const streamingContent = document.getElementById('streaming-content');
        const thoughtContent = document.getElementById('thought-content');
        const thoughtContainer = document.getElementById('thought-process-container');

        let accumulatedContent = "";
        let thinkContent = "";
        let inThinkBlock = false;
        let thinkingComplete = false;

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMPARE_POLICY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                policies: fileContents,
                language: language
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error ? errorData.error.message : 'Unknown error'}`);
        }

        // Get the response as a readable stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        // Set view to analysis to show streaming content
        setView('analysis');

        // Process the stream (similar to analyzeWithLLM)
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk and process it
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim() === '' || !line.startsWith('data: ')) continue;

                const data = line.substring(6); // Remove 'data: ' prefix

                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0].delta.content || "";

                    if (content) {
                        // Handle thought process markers and content streaming
                        if (content.includes('<think>')) {
                            inThinkBlock = true;
                            const thinkStart = content.indexOf('<think>') + 7;
                            thinkContent = content.substring(thinkStart);
                            updateThoughtContent(thoughtContent, thinkContent);
                        } else if (content.includes('</think>')) {
                            inThinkBlock = false;
                            thinkingComplete = true;
                            const thinkEnd = content.indexOf('</think>');
                            if (thinkEnd > 0) {
                                thinkContent = content.substring(0, thinkEnd);
                                updateThoughtContent(thoughtContent, thinkContent);
                            }

                            createCollapsibleThoughtElement(thoughtContainer, thoughtContent);

                            if (thinkEnd + 8 < content.length) {
                                accumulatedContent += content.substring(thinkEnd + 8);
                                streamingContent.innerHTML = accumulatedContent;
                            }
                        } else if (inThinkBlock) {
                            thinkContent += content;
                            updateThoughtContent(thoughtContent, thinkContent);
                        } else {
                            accumulatedContent += content;
                            streamingContent.innerHTML = accumulatedContent;
                        }
                    }
                } catch (error) {
                    console.error("Error parsing chunk:", error, data);
                }
            }
        }

        if (!thinkingComplete) {
            thoughtContainer.classList.add('hidden');
        }

        if (accumulatedContent.includes('Invalid insurance policy input.')) {
            throw new Error('Invalid insurance policy input detected by LLM.');
        }

    } catch (error) {
        console.error("Overall error during policy comparison:", error);
        errorMessageP.textContent = `An error occurred during policy comparison: ${error.message}. Please try again.`;
        invalidLlmResponseDiv.innerHTML = '';
        invalidLlmResponseContainer.classList.add('hidden');
        setView('error');
    }
}

// Helper function to update thought content
function updateThoughtContent(thoughtContent, content) {
    thoughtContent.innerHTML = '';
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.trim()) {
            const p = document.createElement('p');
            p.textContent = line;
            p.className = 'mb-1';
            thoughtContent.appendChild(p);
        }
    }
    // Auto-scroll to the bottom
    thoughtContent.scrollTop = thoughtContent.scrollHeight;
}

// Helper function to create collapsible thought element
function createCollapsibleThoughtElement(container, thoughtContent) {
    // Create disclaimer element
    const disclaimerElement = document.createElement('div');
    disclaimerElement.className = 'bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-3 text-xs text-gray-700';
    disclaimerElement.innerHTML = '<strong>Disclaimer:</strong> The results are generated by AI and should not be fully relied upon for deterministic decisions. Please double check and confirm all information before making any decisions based on this analysis.';

    const detailsElement = document.createElement('details');
    detailsElement.className = 'bg-gray-100 p-3 rounded-lg border border-gray-200';

    const summaryElement = document.createElement('summary');
    summaryElement.className = 'font-semibold cursor-pointer text-gray-700 hover:text-[#A37F64] text-sm';
    summaryElement.textContent = 'Thought Process / Internal Analysis (Click to expand)';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'thought-content-fixed mt-2 text-xs text-gray-600 space-y-2';
    contentDiv.innerHTML = thoughtContent.innerHTML;

    detailsElement.appendChild(summaryElement);
    detailsElement.appendChild(contentDiv);

    container.innerHTML = '';
    container.appendChild(disclaimerElement); // Add disclaimer first
    container.appendChild(detailsElement);    // Then add the collapsible element
}

// Updated event listeners
fileUploadInput.addEventListener('change', (event) => {
    if (!checkPrivacyConsent()) {
        event.preventDefault();
        event.target.value = '';
        return;
    }

    if (event.target.files.length > 0) {
        const newFiles = Array.from(event.target.files);
        
        // Add new files to current files array
        if (currentAnalysisMode === 'single') {
            currentFiles = [newFiles[0]]; // Only keep the first file for single mode
        } else {
            // For comparison mode, limit to 2 files total
            const remainingSlots = 2 - currentFiles.length;
            if (remainingSlots > 0) {
                const filesToAdd = newFiles.slice(0, remainingSlots);
                currentFiles = [...currentFiles, ...filesToAdd];
                
                // Show message if user tried to upload more than allowed
                if (newFiles.length > remainingSlots) {
                    alert(`Only ${remainingSlots} more file(s) can be added. Comparison mode is limited to 2 policies.`);
                }
            } else {
                alert('Maximum of 2 files allowed for comparison. Please remove a file first if you want to upload a different one.');
            }
            
            // Remove duplicates based on file name and size
            currentFiles = currentFiles.filter((file, index, self) => 
                index === self.findIndex(f => f.name === file.name && f.size === file.size)
            );
        }
        
        displaySelectedFiles();
        event.target.value = ''; // Clear input to allow re-selecting same files
    }
});

// Analysis mode change handler
document.addEventListener('change', (event) => {
    if (event.target.name === 'analysis-mode') {
        updateUIForMode(event.target.value);
    }
});

// Analyze button click handler
analyzeButton.addEventListener('click', async () => {
    if (!validateFileSelection()) {
        return;
    }
    
    await handleMultipleFileUploadProcess(currentFiles);
});

// Clear files button click handler
clearFilesButton.addEventListener('click', () => {
    clearSelectedFiles();
});

// Privacy consent handling
function checkPrivacyConsent() {
    const hasConsented = localStorage.getItem('privacy-consent');
    if (!hasConsented) {
        showPrivacyModal();
        return false;
    }
    return true;
}

function showPrivacyModal() {
    privacyModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function hidePrivacyModal() {
    privacyModal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

function handlePrivacyAccept() {
    localStorage.setItem('privacy-consent', 'true');
    localStorage.setItem('privacy-consent-date', new Date().toISOString());
    hidePrivacyModal();
}

function handlePrivacyDecline() {
    // Redirect to a different page or show a message
    alert('You must accept the privacy policy to use this service.');
}

// Make removeFile function globally available
window.removeFile = removeFile;

// Initial setup on page load
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for privacy modal
    privacyAcceptBtn.addEventListener('click', handlePrivacyAccept);
    privacyDeclineBtn.addEventListener('click', handlePrivacyDecline);
    checkPrivacyConsent();

    tryAgainBtn.addEventListener('click', () => {
        window.location.reload();
    });
    
    // Initialize mode selection tabs
    initializeModeSelection();
    
    setView('upload');
});

// Update DOM elements section
const floatingPrintBtn = document.getElementById('floating-print-btn');

// Enhanced print functionality
function printAnalysisResults() {
    // Check if there are results to print
    const resultsContent = document.getElementById('multi-model-results');
    if (!resultsContent || resultsContent.textContent.includes('No policy content available')) {
        // Show a more user-friendly notification
        showNotification('No analysis results available to print. Please analyze a policy first.', 'warning');
        return;
    }
    
    // Store current view state
    const currentViewState = currentView;
    
    // Temporarily show only the analysis view for printing
    if (currentView !== 'analysis') {
        setView('analysis');
    }
    
    // Add print-specific title
    const originalTitle = document.title;
    const analysisTitle = document.querySelector('#analysis-view h2')?.textContent || 'Insurance Policy Analysis';
    document.title = analysisTitle;
    
    // Add a brief delay to ensure view is properly set
    setTimeout(() => {
        // Trigger print dialog
        window.print();
        
        // Restore original title
        document.title = originalTitle;
        
        // Restore original view if it was different
        if (currentViewState !== 'analysis') {
            setTimeout(() => setView(currentViewState), 100);
        }
    }, 100);
}

// Function to show/hide floating print button
function toggleFloatingPrintButton(show = false) {
    if (floatingPrintBtn) {
        if (show) {
            floatingPrintBtn.classList.remove('hidden');
            // Add floating animation after a short delay
            setTimeout(() => {
                floatingPrintBtn.classList.add('animate-float');
            }, 300);
        } else {
            floatingPrintBtn.classList.remove('animate-float');
            floatingPrintBtn.classList.add('hidden');
        }
    }
}

// Enhanced setView function to handle floating button
function setView(viewName) {
    uploadView.classList.add('hidden');
    processingView.classList.add('hidden');
    analysisView.classList.add('hidden');
    errorView.classList.add('hidden');

    uploadView.classList.remove('flex-col');
    processingView.classList.remove('flex-col');
    errorView.classList.remove('flex-col');

    switch (viewName) {
        case 'upload':
            uploadView.classList.remove('hidden');
            uploadView.classList.add('flex-col');
            toggleFloatingPrintButton(false);
            break;
        case 'processing':
            processingView.classList.remove('hidden');
            processingView.classList.add('flex-col');
            toggleFloatingPrintButton(false);
            break;
        case 'analysis':
            analysisView.classList.remove('hidden');
            invalidLlmResponseContainer.classList.add('hidden');
            // Show floating print button when analysis results are displayed
            toggleFloatingPrintButton(true);
            break;
        case 'error':
            errorView.classList.remove('hidden');
            errorView.classList.add('flex-col');
            toggleFloatingPrintButton(false);
            break;
    }
    currentView = viewName;
}

// Simple notification function (you can enhance this further)
function showNotification(message, type = 'info') {
    // Create a simple toast notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-all duration-300 ${
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add event listener for floating print button
if (floatingPrintBtn) {
    floatingPrintBtn.addEventListener('click', printAnalysisResults);
}

// Enhanced keyboard shortcut for printing
document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'p' && currentView === 'analysis') {
        event.preventDefault();
        printAnalysisResults();
    }
});

