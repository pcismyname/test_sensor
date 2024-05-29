let accelerationData = [];

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            accelerationData = parseCSV(text);
            document.getElementById('movementCount').innerText = 'Movement Count: 0';
        };
        reader.readAsText(file);
    }
});

document.getElementById('processButton').addEventListener('click', function() {
    if (accelerationData.length === 0) {
        alert('Please upload a CSV file first.');
        return;
    }
    const multiplier = 1.5; // Adjust this multiplier based on your data characteristics

    // const threshold = parseFloat(document.getElementById('thresholdInput').value);
    const result = integrate(accelerationData);
    const threshold = calculateThreshold(result.position, multiplier);

    displayResult(accelerationData, result);
    const movementCount = countPeaks(result.position, threshold);
    document.getElementById('movementCount').innerText = 'Movement Count: ' + movementCount;
});

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const result = [];
    for (let i = 1; i < lines.length; i++) { // Skip header line
        const [time, seconds_elapsed, z, y, x] = lines[i].split(',').map(parseFloat);
        result.push({ seconds_elapsed, x, y, z });
    }
    return result;
}

function integrate(accelerationData) {
    let velocity = [{ x: 0, y: 0, z: 0 }];
    let position = [{ x: 0, y: 0, z: 0 }];
    let displacement = [0];  // Initial displacement
    let accelerationMagnitude = [0];  // Initial acceleration magnitude

    // First integral for velocity
    for (let i = 1; i < accelerationData.length; i++) {
        const dt = accelerationData[i].seconds_elapsed - accelerationData[i - 1].seconds_elapsed;
        const velX = velocity[i - 1].x + (accelerationData[i - 1].x + accelerationData[i].x) / 2 * dt;
        const velY = velocity[i - 1].y + (accelerationData[i - 1].y + accelerationData[i].y) / 2 * dt;
        const velZ = velocity[i - 1].z + (accelerationData[i - 1].z + accelerationData[i].z) / 2 * dt;

        velocity.push({ x: velX, y: velY, z: velZ });

        // Calculate acceleration magnitude (L2 norm)
        const accMag = Math.sqrt(
            Math.pow(accelerationData[i].x, 2) +
            Math.pow(accelerationData[i].y, 2) +
            Math.pow(accelerationData[i].z, 2)
        );
        accelerationMagnitude.push(accMag);
    }

    // Second integral for position
    for (let i = 1; i < velocity.length; i++) {
        const dt = accelerationData[i].seconds_elapsed - accelerationData[i - 1].seconds_elapsed;
        const posX = position[i - 1].x + (velocity[i - 1].x + velocity[i].x) / 2 * dt;
        const posY = position[i - 1].y + (velocity[i - 1].y + velocity[i].y) / 2 * dt;
        const posZ = position[i - 1].z + (velocity[i - 1].z + velocity[i].z) / 2 * dt;

        position.push({ x: posX, y: posY, z: posZ });

        // Calculate displacement from the origin
        const disp = Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2) + Math.pow(posZ, 2));
        displacement.push(disp);
    }

    return { velocity, position, displacement, accelerationMagnitude };
}

function countMovements(positionData, threshold) {
    let movementCount = 0;
    let inMotion = false;
    let lastPosition = { x: 0, y: 0, z: 0 };

    for (let i = 1; i < positionData.length; i++) {
        const displacement = Math.sqrt(
            Math.pow(positionData[i].x - lastPosition.x, 2) +
            Math.pow(positionData[i].y - lastPosition.y, 2) +
            Math.pow(positionData[i].z - lastPosition.z, 2)
        );

        if (!inMotion && displacement > threshold) {
            inMotion = true;
        } else if (inMotion && displacement < threshold) {
            inMotion = false;
            movementCount++;
        }
        lastPosition = positionData[i];
    }

    return movementCount;
}

function calculateThreshold(positionData, multiplier) {
    let sum = 0;
    for (let i = 0; i < positionData.length; i++) {
        sum += Math.abs(positionData[i].y);
    }
    const average = sum / positionData.length;
    return average * multiplier;
}

function countPeaks(positionData, threshold) {
    let peakCount = 0;
    let inPeak = false;
    console.log(threshold);
    for (let i = 1; i < positionData.length; i++) {
        const positionDataY = positionData[i].y;

        if (!inPeak && positionDataY > threshold) {
            inPeak = true;
            peakCount++;
        } else if (inPeak && positionDataY < threshold) {
            inPeak = false;
        }
    }

    return peakCount;
}


function displayResult(original, result) {
    const ctx = document.getElementById('chart').getContext('2d');
    if (Chart.getChart('chart')) {
        Chart.getChart('chart').destroy();
    }

    const labels = original.map((data, index) => index);

    const originalDataX = original.map(d => d.x);
    const velocityDataX = result.velocity.map(d => d.x);
    const positionDataX = result.position.map(d => d.x);

    const originalDataY = original.map(d => d.y);
    const velocityDataY = result.velocity.map(d => d.y);
    const positionDataY = result.position.map(d => d.y);

    const originalDataZ = original.map(d => d.z);
    const velocityDataZ = result.velocity.map(d => d.z);
    const positionDataZ = result.position.map(d => d.z);

    const displacementData = result.displacement;
    const accelerationMagnitudeData = result.accelerationMagnitude;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Original X',
                    borderColor: 'rgb(255, 99, 132)',
                    fill: false,
                    data: originalDataX
                },
                {
                    label: 'Velocity X',
                    borderColor: 'rgb(54, 162, 235)',
                    fill: false,
                    data: velocityDataX
                },
                {
                    label: 'Position X',
                    borderColor: 'rgb(75, 192, 192)',
                    fill: false,
                    data: positionDataX
                },
                {
                    label: 'Original Y',
                    borderColor: 'rgb(255, 206, 86)',
                    fill: false,
                    data: originalDataY
                },
                {
                    label: 'Velocity Y',
                    borderColor: 'rgb(153, 102, 255)',
                    fill: false,
                    data: velocityDataY
                },
                {
                    label: 'Position Y',
                    borderColor: 'rgb(255, 159, 64)',
                    fill: false,
                    data: positionDataY
                },
                {
                    label: 'Original Z',
                    borderColor: 'rgb(99, 255, 132)',
                    fill: false,
                    data: originalDataZ
                },
                {
                    label: 'Velocity Z',
                    borderColor: 'rgb(162, 235, 54)',
                    fill: false,
                    data: velocityDataZ
                },
                {
                    label: 'Position Z',
                    borderColor: 'rgb(192, 192, 75)',
                    fill: false,
                    data: positionDataZ
                },
                {
                    label: 'Displacement',
                    borderColor: 'rgb(255, 159, 64)',
                    fill: false,
                    data: displacementData
                },
                {
                    label: 'Acceleration Magnitude',
                    borderColor: 'rgb(0,191,255)ข ขช ',
                    fill: false,
                    data: accelerationMagnitudeData
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy'
                    }
                }
            },
            title: {
                display: true,
                text: 'Accelerometer Data Integration'
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Sample Index'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        }
    });
}
