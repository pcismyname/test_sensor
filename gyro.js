let gyroData = [];

document.getElementById('gyroFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            gyroData = parseGyroCSV(text);
            document.getElementById('gyroMovementCount').innerText = 'Movement Count: 0';
        };
        reader.readAsText(file);
    }
});

document.getElementById('gyroProcessButton').addEventListener('click', function() {
    if (gyroData.length === 0) {
        alert('Please upload a CSV file first.');
        return;
    }
    //const threshold = parseFloat(document.getElementById('gyroThresholdInput').value);
    const result = integrateGyro(gyroData);
    displayGyroResult(gyroData, result);
    // const movementCount = countGyroMovements(result.angle, threshold);
    const multiplier = 2; // Adjust this multiplier based on your data characteristics
    const threshold = calculateThreshold(result.angle, multiplier);
    console.log(threshold);
    const movementCount = countMovements(result.angle, threshold);
    document.getElementById('gyroMovementCount').innerText = 'Movement Count: ' + movementCount;
});

function parseGyroCSV(text) {
    const lines = text.trim().split('\n');
    const result = [];
    for (let i = 1; i < lines.length; i++) { // Skip header line
        const [time, seconds_elapsed, z, y, x] = lines[i].split(',').map(parseFloat);
        result.push({ seconds_elapsed, x, y, z });
    }
    return result;
}

function integrateGyro(gyroData) {
    let angle = [{ x: 0, y: 0, z: 0 }];

    // Integral for angle
    for (let i = 1; i < gyroData.length; i++) {
        const dt = gyroData[i].seconds_elapsed - gyroData[i - 1].seconds_elapsed;
        const angX = angle[i - 1].x + (gyroData[i - 1].x + gyroData[i].x) / 2 * dt;
        const angY = angle[i - 1].y + (gyroData[i - 1].y + gyroData[i].y) / 2 * dt;
        const angZ = angle[i - 1].z + (gyroData[i - 1].z + gyroData[i].z) / 2 * dt;

        angle.push({ x: angX, y: angY, z: angZ });
    }

    return { angle };
}

// function countGyroMovements(angleData, threshold) {
//     let movementCount = 0;
//     let inMotion = false;
//     let lastAngle = { x: 0, y: 0, z: 0 };

//     for (let i = 1; i < angleData.length; i++) {
//         const angularDisplacement = Math.sqrt(
//             Math.pow(angleData[i].x - lastAngle.x, 2) +
//             Math.pow(angleData[i].y - lastAngle.y, 2) +
//             Math.pow(angleData[i].z - lastAngle.z, 2)
//         );

//         if (!inMotion && angularDisplacement > threshold) {
//             inMotion = true;
//         } else if (inMotion && angularDisplacement < threshold) {
//             inMotion = false;
//             movementCount++;
//         }
//         lastAngle = angleData[i];
//     }
//     console.log(movementCount);
//     return movementCount;
// }

function calculateThreshold(accelerationData, multiplier) {
    const slopes = accelerationData.map((acc, i, arr) => i > 0 ? Math.abs(acc.y - arr[i - 1].y) : 0).slice(1);
    const meanSlope = slopes.reduce((sum, slope) => sum + slope, 0) / slopes.length;
    const stdDevSlope = Math.sqrt(slopes.map(x => Math.pow(x - meanSlope, 2)).reduce((sum, x) => sum + x, 0) / slopes.length);
    return stdDevSlope * multiplier;
}

function countMovements(angle, threshold) {

    // Now, detect local minima in the Angle Y data
    let movementCount = 0;
    let descending = false;
    // console.log(angle)
    for (let i = 1; i < angle.length - 1; i++) {
        // Calculate the slope
        const slope = angle[i].y - angle[i - 1].y;

        // Check for significant downward trend
        if (slope < -threshold) {
            descending = true;
        }

        // Check for valley (significant local minimum)
        if (descending && slope > threshold) {
            movementCount += 1;
            descending = false;
        }
    }

    return movementCount;
}


function displayGyroResult(original, result) {
    const ctx = document.getElementById('gyroChart').getContext('2d');
    if (Chart.getChart('gyroChart')) {
        Chart.getChart('gyroChart').destroy();
    }

    const labels = original.map((data, index) => index);

    const originalDataX = original.map(d => d.x);
    const angleDataX = result.angle.map(d => d.x);

    const originalDataY = original.map(d => d.y);
    const angleDataY = result.angle.map(d => d.y);

    const originalDataZ = original.map(d => d.z);
    const angleDataZ = result.angle.map(d => d.z);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Gyro X',
                    borderColor: 'rgb(255, 99, 132)',
                    fill: false,
                    data: originalDataX
                },
                {
                    label: 'Angle X',
                    borderColor: 'rgb(54, 162, 235)',
                    fill: false,
                    data: angleDataX
                },
                {
                    label: 'Gyro Y',
                    borderColor: 'rgb(255, 206, 86)',
                    fill: false,
                    data: originalDataY
                },
                {
                    label: 'Angle Y',
                    borderColor: 'rgb(75, 192, 192)',
                    fill: false,
                    data: angleDataY
                },
                {
                    label: 'Gyro Z',
                    borderColor: 'rgb(99, 255, 132)',
                    fill: false,
                    data: originalDataZ
                },
                {
                    label: 'Angle Z',
                    borderColor: 'rgb(192, 192, 75)',
                    fill: false,
                    data: angleDataZ
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
                text: 'Gyroscope Data Integration'
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
