const AppState = {
    selectedTreeId: null,
    activeStageTimelineIndex: 5, // Defaulting to 5 for the "Big Image" view
    activeFilters: {
        searchQuery: "",
        woodType: "ALL"
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initCatalog();
    setupEventListeners();
});

// Helper: Null Safety Parser
const parseVal = (val) => {
    return (val === "" || val === null || val === undefined || val === "NaN" || Number.isNaN(val)) ? "--" : val;
};

function initCatalog() {
    const catalog = document.getElementById('tree-catalog');
    catalog.innerHTML = '';
    
    let filteredData = [...treeData];

    // Standard Text/Type Filters
    const query = AppState.activeFilters.searchQuery.toLowerCase();
    const type = AppState.activeFilters.woodType;
    
    filteredData = filteredData.filter(t => {
        const matchName = t.Tree && t.Tree.toLowerCase().includes(query);
        const matchType = type === "ALL" || t["Wood Type"] === type;
        return matchName && matchType;
    });

    filteredData.forEach(tree => {
        const treeIdClean = tree.Tree.toLowerCase().replace(/\s/g, '');
        
        const card = document.createElement('div');
        card.className = 'tree-card';
        card.dataset.name = tree.Tree;

        // Determine the wood badge display text
        const woodTypeRaw = tree["Wood Type"];
        const woodDisplay = (woodTypeRaw === "NONE" || !woodTypeRaw) ? "Unknown" : `${parseVal(woodTypeRaw)}wood`;

        // Dynamically load the log image in the sidebar
        card.innerHTML = `
            <img class="card-img-placeholder" src="assets/images/logs/${treeIdClean}_log.png" onerror="this.src='assets/images/fallback_frame.png'" alt="${tree.Tree} Log">
            <div class="card-details">
                <h4>${tree.Tree}</h4>
                <span class="wood-badge">${woodDisplay}</span>
            </div>
        `;
        card.addEventListener('click', () => selectTree(tree));
        catalog.appendChild(card);
    });
}

function selectTree(tree) {
    AppState.selectedTreeId = tree;
    AppState.activeStageTimelineIndex = 5; // Reset to stage 5 visually when switching trees
    const treeIdClean = tree.Tree.toLowerCase().replace(/\s/g, '');
    
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('detail-content').classList.remove('hidden');

    // Header Updates
    document.getElementById('dt-name').innerText = tree.Tree;

    // 1. Growth Requirements Binding
    document.getElementById('dt-spacing').innerText = parseVal(tree["Spacing"]);
    document.getElementById('dt-growth-time').innerText = parseVal(tree["Growth Time"]);
    
    document.getElementById('dt-depth').innerText = parseVal(tree["Dirt Depth Required"]);
    document.getElementById('dt-station').innerText = parseVal(tree["Station Level Required"]);
    document.getElementById('dt-cost').innerText = parseVal(tree["LE Cost"]);

    // 2. Logic for the Hint Box (Guaranteed Growth & Special Extras)
    const hintContainer = document.getElementById('dt-hint-container');
    const hintGuaranteed = document.getElementById('dt-hint-guaranteed');
    const hintExtras = document.getElementById('dt-hint-extras');
    
    // Check states
    const isGuaranteed = String(tree["Growth stages guarenteed?"]).toUpperCase() === "YES";
    const specialExtras = tree["Special Extras"];
    const hasExtras = specialExtras && specialExtras !== "NONE" && specialExtras.trim() !== "";

    // Toggle logic
    if (!isGuaranteed || hasExtras) {
        hintContainer.classList.remove('hidden'); // Show the wrapper
        
        if (!isGuaranteed) {
            hintGuaranteed.classList.remove('hidden');
        } else {
            hintGuaranteed.classList.add('hidden');
        }

        if (hasExtras) {
            hintExtras.classList.remove('hidden');
            document.getElementById('dt-extras-text').innerText = specialExtras;
        } else {
            hintExtras.classList.add('hidden');
        }
    } else {
        // If it IS guaranteed and HAS NO extras, hide the whole box
        hintContainer.classList.add('hidden');
    }
    
    // Loot Table Binding
    document.getElementById('img-loot-log').src = `assets/images/logs/${treeIdClean}_log.png`;
    document.getElementById('dt-logs').innerText = parseVal(tree["Logs"]);
    document.getElementById('dt-sticks').innerText = parseVal(tree["Sticks"]);
    document.getElementById('dt-fibre').innerText = parseVal(tree["Fibre"]);
    document.getElementById('dt-sap').innerText = parseVal(tree["Sap"]);

    // Probabilities and Global Any-Stage rule
    document.getElementById('dt-probabilities').innerText = parseVal(tree["% reaching each stage"]);
    document.getElementById('dt-any-stage').innerText = parseVal(tree["Any stage"]);

    updateTimelineMatrix();
}

function updateTimelineMatrix() {
    const tree = AppState.selectedTreeId;
    if (!tree) return;

    // Update active button classes
    const nodes = document.querySelectorAll('.node-btn');
    nodes.forEach(n => {
        n.classList.remove('active');
        if (parseInt(n.dataset.stage) === AppState.activeStageTimelineIndex) {
            n.classList.add('active');
        }
    });

    // Update Main Tree Image source based on the selected timeline stage
    const treeIdClean = tree.Tree.toLowerCase().replace(/\s/g, '');
    document.getElementById('dt-main-img').src = `assets/images/trees/${treeIdClean}/stage_${AppState.activeStageTimelineIndex}.png`;

    // Rule Tray Mapping based on stage selected
    let ruleText = "No data available.";
    switch (AppState.activeStageTimelineIndex) {
        case 1: ruleText = parseVal(tree["Block sapling"]); break;
        case 2: ruleText = parseVal(tree["Block Stage 1-->2"]); break;
        case 3: ruleText = parseVal(tree["Block Stage 2-->3"]); break;
        case 4: ruleText = parseVal(tree["Block Stage 3-->4"]); break;
        case 5: ruleText = parseVal(tree["Block Stage 4-->5"]); break;
    }
    document.getElementById('dt-rule-output').innerText = ruleText;
}

function setupEventListeners() {
    // Stage Timeline Buttons
    document.querySelectorAll('.node-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            AppState.activeStageTimelineIndex = parseInt(e.target.dataset.stage);
            updateTimelineMatrix();
        });
    });

    // Sidebar Search Filter
    document.getElementById('search-box').addEventListener('input', (e) => {
        AppState.activeFilters.searchQuery = e.target.value;
        initCatalog();
    });

    // Sidebar Type Filter
    document.getElementById('wood-type-dropdown').addEventListener('change', (e) => {
        AppState.activeFilters.woodType = e.target.value;
        initCatalog();
    });
}