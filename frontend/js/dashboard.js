// dashboard.js

// Check authentication on page load
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }
    document.getElementById('userEmail').textContent = localStorage.getItem('userEmail');
    loadDashboardData();
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '../index.html';
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/will/current', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateDashboard(data);
        } else {
            // Show no will message
            document.getElementById('noWillMessage').classList.remove('hidden');
            document.getElementById('willContent').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Update dashboard with will data
function updateDashboard(data) {
    if (!data.will) {
        document.getElementById('noWillMessage').classList.remove('hidden');
        document.getElementById('willContent').classList.add('hidden');
        return;
    }

    // Update stats
    document.getElementById('totalAssets').textContent = formatCurrency(calculateTotalAssets(data.will.assets));
    document.getElementById('totalBeneficiaries').textContent = data.will.beneficiaries.length;
    document.getElementById('lastUpdated').textContent = formatDate(data.will.updatedAt);

    // Show will content
    document.getElementById('noWillMessage').classList.add('hidden');
    document.getElementById('willContent').classList.remove('hidden');

    // Update asset table
    updateAssetTable(data.will.assets, data.will.beneficiaries);
}

// Modal Functions
function openCreateWillModal() {
    document.getElementById('createWillModal').classList.remove('hidden');
}

function closeCreateWillModal() {
    document.getElementById('createWillModal').classList.add('hidden');
}

// Add beneficiary input to form
function addBeneficiaryInput() {
    const beneficiaryList = document.getElementById('beneficiaryList');
    const beneficiaryDiv = document.createElement('div');
    beneficiaryDiv.className = 'flex space-x-2';
    beneficiaryDiv.innerHTML = `
        <input type="text" name="beneficiaryName[]" placeholder="Name" class="flex-1 p-2 border rounded" required>
        <input type="email" name="beneficiaryEmail[]" placeholder="Email" class="flex-1 p-2 border rounded" required>
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-600">Remove</button>
    `;
    beneficiaryList.appendChild(beneficiaryDiv);
}

// Add asset input to form
function addAssetInput() {
    const assetList = document.getElementById('assetList');
    const assetDiv = document.createElement('div');
    assetDiv.className = 'flex space-x-2';
    assetDiv.innerHTML = `
        <input type="text" name="assetName[]" placeholder="Asset Name" class="flex-1 p-2 border rounded" required>
        <input type="number" name="assetValue[]" placeholder="Value" class="w-32 p-2 border rounded" required>
        <select name="assetType[]" class="w-40 p-2 border rounded" required>
            <option value="property">Property</option>
            <option value="cash">Cash</option>
            <option value="investment">Investment</option>
            <option value="other">Other</option>
        </select>
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-600">Remove</button>
    `;
    assetList.appendChild(assetDiv);
}

// Handle create will form submission
document.getElementById('createWillForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Process form data
    const willData = {
    fullName: formData.get('fullName'),
    beneficiaries: [],
    assets: []
};

// Process beneficiaries
const beneficiaryNames = formData.getAll('beneficiaryName[]');
const beneficiaryEmails = formData.getAll('beneficiaryEmail[]');
beneficiaryNames.forEach((name, index) => {
    willData.beneficiaries.push({
        name: name,
        email: beneficiaryEmails[index]
    });
});

// Process assets
const assetNames = formData.getAll('assetName[]');
const assetValues = formData.getAll('assetValue[]');
const assetTypes = formData.getAll('assetType[]');
assetNames.forEach((name, index) => {
    willData.assets.push({
        name: name,
        value: parseFloat(assetValues[index]), // Ensure numeric type
        type: assetTypes[index]
    });
});

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/will/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(willData)
        });

        if (response.ok) {
            closeCreateWillModal();
            loadDashboardData();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to create will');
        }
    } catch (error) {
        console.error('Error creating will:', error);
        alert('Failed to create will');
    }
});

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function updateAssetTable(assets, beneficiaries) {
    const assetTable = document.getElementById('assetTable');
    assetTable.innerHTML = ''; // Clear existing rows

    assets.forEach(asset => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${beneficiaries.map(b => b.name).join(', ')}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${asset.type}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(asset.value)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-green-500">Active</td>
        `;
        assetTable.appendChild(row);
    });
}


function calculateTotalAssets(assets) {
    return assets.reduce((total, asset) => total + asset.value, 0);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:5000/api/assets', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch assets');
        }
        const assets = await response.json();
        displayAssets(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
    }
});
function displayAssets(assets) {
    const assetContainer = document.getElementById('assetContainer');
    assetContainer.innerHTML = '';

    assets.realEstateProperties.forEach(property => {
        const card = createCard(property, 'Real Estate Property');
        assetContainer.appendChild(card);
    });

    assets.bankAccounts.forEach(account => {
        const card = createCard(account, 'Bank Account');
        assetContainer.appendChild(card);
    });

    assets.investments.forEach(investment => {
        const card = createCard(investment, 'Investment');
        assetContainer.appendChild(card);
    });

    assets.otherAssets.forEach(asset => {
        const card = createCard(asset, 'Other Asset');
        assetContainer.appendChild(card);
    });
}

function createCard(item, type) {
    const card = document.createElement('div');
    card.className = 'bg-gray-500 m-4 p-4 rounded-lg shadow mb-4 border-l-4 border-green-500';
    card.innerHTML = `
        <h3 class="text-lg font-semibold col-span-3">${type}</h3>
        <p class="col-span-1"><strong>Name/Description:</strong> ${item.name || item.description}</p>
        <p class="col-span-1"><strong>Estimated Value:</strong> ${item.estimatedValue || item.currentValue}</p>
        <p class="col-span-1"><strong>Ownership Type:</strong> ${item.ownershipType || 'N/A'}</p>
    `;
    return card;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', checkAuth);