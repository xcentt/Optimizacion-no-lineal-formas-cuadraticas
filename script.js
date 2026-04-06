// Fixed classify function
function classify(value) {
    if (value < 0) {
        return 'Negative';
    } else if (value > 0) {
        return 'Positive';
    } else {
        return 'Zero';
    }
}

// Event listener for generateBtn
const generateBtn = document.getElementById('generateBtn');
generateBtn.addEventListener('click', function() {
    console.log('Generate button clicked');
    // Add your generate logic here
});

// Event listener for computeBtn
const computeBtn = document.getElementById('computeBtn');
computeBtn.addEventListener('click', function() {
    console.log('Compute button clicked');
    // Add your compute logic here
});