const AppState = {
    selectedTreeId: null,
    activeStageTimelineIndex: 1,
    activeFilters: {
        searchQuery: "",
        woodType: "ALL",
        topProducerType: null // "Logs" | "Sticks" | "Fibre" | "Sap" | null
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initCatalog();
    setupEventListeners();
});

// Helper: Null Safety Parser
const parseVal = (val) => {
    return (val === "" || val === null || val === undefined || val === "NaN") ? "--" : val;
};

// 1. Render Catalog Loop
function initCatalog() {
    const catalog = document.getElementById('tree-catalog');
    catalog.innerHTML = '';
    
    let filteredData = [...treeData];

    // Filter Logic: High-Yield Top Producer
    if (AppState.activeFilters.topProducerType) {
        const metric = AppState.activeFilters.topProducerType;
        filteredData = filteredData.filter(t => !isNaN(parseFloat(t[metric])));
        filteredData.sort((a, b) => parseFloat(b[metric]) - parseFloat(a[metric]));
        filteredData = filteredData.slice(0, 3);
    } else {
        // Standard Text/Type Filters
        const query = AppState.activeFilters.searchQuery.toLowerCase();
        const type = AppState.activeFilters.woodType;
        
        filteredData = filteredData.filter(t => {
            const matchName = t.Tree && t.Tree.toLowerCase().includes(query);
            const matchType = type === "ALL" || t["Wood Type"] === type;
            return matchName && matchType;
        });
    }

    filteredData.forEach(tree => {
        const card = document.createElement('div');
        card.className = 'tree-card';
        if (AppState.activeFilters.topProducerType) {
            card.classList.add('card-featured-glow');
        }

        card.dataset.name = tree.Tree;
        card.dataset.id = tree.Tree.toLowerCase().replace(/\s/g, '');

        card.innerHTML = `
            <div class="card-img-placeholder"></div>
            <div class="card-details">
                <h4>${tree.Tree}</h4>
                <span class="wood-badge">${parseVal(tree["Wood Type"])} Wood</span>
            </div>
        `;
        card.addEventListener('click', () => selectTree(tree));
        catalog.appendChild(card);
    });
}

function selectTree(tree) {
    AppState.selectedTreeId = tree;
    AppState.activeStageTimelineIndex = 1;
    
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('detail-content').classList.remove('hidden');

    // Header updates
    document.getElementById('dt-name').innerText = tree.Tree;
    
    const extraInfo = document.getElementById('dt-extra-info-container');
    if (tree["Special Extras"]) {
        extraInfo.classList.remove('hidden');
        document.getElementById('dt-extra-info').innerText = tree["Special Extras"];
    } else {
        extraInfo.classList.add('hidden');
    }

    // Dashboard Grid Data Binding
    document.getElementById('dt-depth').innerText = parseVal(tree["Dirt Depth Required"]);
    document.getElementById('dt-spacing').innerText = parseVal(tree["Min Spacing (Radius)"]);
    document.getElementById('dt-station').innerText = parseVal(tree["Station Level Required"]);
    document.getElementById('dt-cost').innerText = parseVal(tree["LE Cost"]);

    document.getElementById('dt-guaranteed').innerHTML = tree["Growth stages guarenteed?"] === "Yes" ? "✅ Yes" : "❌ No";
    document.getElementById('dt-probabilities').innerText = parseVal(tree["% reaching each stage"]);
    document.getElementById('dt-time').innerText = parseVal(tree["Time"]);

    document.getElementById('dt-logs').innerText = parseVal(tree["Logs"]);
    document.getElementById('dt-sticks').innerText = parseVal(tree["Sticks"]);
    document.getElementById('dt-fibre').innerText = parseVal(tree["Fibre"]);
    document.getElementById('dt-sap').innerText = parseVal(tree["Sap"]);
    document.getElementById('dt-any-stage').innerText = parseVal(tree["Any stage"]);

    updateTimelineMatrix();
}

function updateTimelineMatrix() {
    const tree = AppState.selectedTreeId;
    if (!tree) return;

    const nodes = document.querySelectorAll('.node-btn');
    nodes.forEach(n => {
        n.classList.remove('active');
        if (parseInt(n.dataset.stage) === AppState.activeStageTimelineIndex) {
            n.classList.add('active');
        }
    });

    // Image rendering setup (Broken Assets Fallback applied natively via HTML onerror)
    const treeIdClean = tree.Tree.toLowerCase().replace(/\s/g, '');
    document.getElementById('dt-stage-img').src = `assets/images/trees/${treeIdClean}/stage_${AppState.activeStageTimelineIndex}.png`;

    // Rule Tray Mapping
    let ruleText = "No data.";
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

    // Sidebar Filters
    document.getElementById('search-box').addEventListener('input', (e) => {
        AppState.activeFilters.searchQuery = e.target.value;
        AppState.activeFilters.topProducerType = null;
        initCatalog();
    });

    document.getElementById('wood-type-dropdown').addEventListener('change', (e) => {
        AppState.activeFilters.woodType = e.target.value;
        AppState.activeFilters.topProducerType = null;
        initCatalog();
    });

    // Header Yield Filters
    document.querySelectorAll('.yield-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.yield-filter').forEach(b => b.classList.remove('active'));
            
            if (AppState.activeFilters.topProducerType === e.target.dataset.metric) {
                AppState.activeFilters.topProducerType = null; 
            } else {
                AppState.activeFilters.topProducerType = e.target.dataset.metric;
                e.target.classList.add('active');
            }
            initCatalog();
        });
    });
}