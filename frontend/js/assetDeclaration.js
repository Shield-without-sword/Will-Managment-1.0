function addAssetInput() {
    const assetList = document.getElementById('assetList');
    const assetDiv = document.createElement('div');
    assetDiv.className = 'flex flex-col space-y-4 p-4 border rounded mb-4';

    assetDiv.innerHTML = `
        <div>
            <label for="assetName">Asset Name:</label>
            <input type="text" name="assetName[]" placeholder="Asset Name" class="w-full p-2 border rounded" required>
        </div>
        <div>
            <label for="assetValue">Value:</label>
            <input type="number" name="assetValue[]" placeholder="Value" class="w-full p-2 border rounded" required>
        </div>
        <div>
            <label for="assetType">Type:</label>
            <select name="assetType[]" class="w-full p-2 border rounded" required>
                <option value="property">Property</option>
                <option value="cash">Cash</option>
                <option value="investment">Investment</option>
                <option value="other">Other</option>
            </select>
        </div>
        <div>
            <label for="assetDescription">Description:</label>
            <textarea name="assetDescription[]" placeholder="Description (e.g., address for property, account number for bank, etc.)" 
                class="w-full p-2 border rounded" required></textarea>
        </div>
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-600">
            Remove
        </button>
    `;

    assetList.appendChild(assetDiv);
}

// Handle form submission
document.getElementById('assetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const assets = [];

    const assetNames = formData.getAll('assetName[]');
    const assetValues = formData.getAll('assetValue[]');
    const assetTypes = formData.getAll('assetType[]');
    const assetDescriptions = formData.getAll('assetDescription[]');

    assetNames.forEach((name, index) => {
        assets.push({
            name,
            value: parseFloat(assetValues[index]),
            type: assetTypes[index],
            description: assetDescriptions[index]
        });
    });

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/assets/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ assets })
        });

        if (response.ok) {
            alert('Assets submitted successfully!');
            window.location.href = 'dashboard.html';
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to submit assets');
        }
    } catch (error) {
        console.error('Error submitting assets:', error);
        alert('An error occurred while submitting assets.');
    }
});

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '../index.html';
}
