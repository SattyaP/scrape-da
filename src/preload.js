const { ipcRenderer } = require('electron'),
XLSX = require('xlsx'),
version = document.getElementById('version'),
warp = document.getElementById('warp'),
message = document.getElementById('message'),
restartButton = document.getElementById('restart-button'),
loaderDownload = document.getElementById('warp-loader'),
start = document.getElementById('start'),
stops = document.getElementById('stop'),
buster = document.getElementById('buster'),
busterKey = document.getElementById('buster-key'),
errorHelper = document.getElementById('error-helper'),
logTextarea = document.getElementById('log'),
progs = document.getElementById('prog'),
table = document.getElementById('table-data'),
files = document.getElementById('files'),
pathReport = document.getElementById('path-report'),
logTable = document.querySelector('table'),
btnExport = document.getElementById('btn-export');

document.addEventListener('change', function () {
    const files = document.getElementById('files').files[0]?.path;
    if (files == null || files == "" || (buster.checked && busterKey.value == "")){
        start.setAttribute('disabled', true);
        errorHelper.textContent = "Something is missing!"
        errorHelper.classList.add('text-danger')
    } else if (files != "") {
        start.removeAttribute('disabled');
        errorHelper.classList.remove('text-danger')
        errorHelper.textContent = "*Make sure all data is filled correctly"
    }

    if (buster.checked) {
        busterKey.disabled = false
    } else {
        busterKey.disabled = true
    }
})

document.getElementById('open-log').addEventListener('click', () => logTextarea.scrollTop = logTextarea.scrollHeight);

start.addEventListener('click', function () {
    const props = {
        files: document.getElementById('files').files[0]?.path,
        headless: document.getElementById('visible').checked ? false : 'new',
        buster: buster.checked,
        busterKey: busterKey.value
    }

    ipcRenderer.send('start-bot', props)
})

function clearLogTable() {
    const rowCount = logTable.rows.length;
    for (let i = rowCount - 1; i > 0; i--) {
        logTable.deleteRow(i);
    }
}

let initNumb = 0
let previousReportData = [];

function PostTable(result) {
    if (result !== undefined) {
        const isDuplicate = previousReportData.some(report => report.url === result.url);

        if (!isDuplicate) {
            initNumb++;
            const newRow = table.insertRow();
            const rowHtml = `<tr>
            <th scope="row">${initNumb}</th>
            <td>${result.url}</td>
            <td>${result.da}</td>
            <td>${result.pa}</td>
            <td>${result.ld}</td>
          </tr>`;

            newRow.innerHTML = rowHtml;
            document.getElementById('scrl').scrollTop = document.getElementById('scrl').scrollHeight;

            previousReportData.push({
                result
            });
        }
    }
}
ipcRenderer.on('logToTable', (event, report) => {
    PostTable(report);
});

function proggress(prog) {
    progs.style.width = `${prog}%`;
    progs.innerHTML = `${prog}%`;
}

ipcRenderer.on('proggress', (event, prog) => {
    for (const pros of prog) {
        proggress(pros);
    }
});

ipcRenderer.on('log', (event, logs) => {
    logTextarea.value = logs;
    logTextarea.scrollTop = logTextarea.scrollHeight;
});

const allElements = [buster, busterKey, files, pathReport, btnExport];

ipcRenderer.on('run', () => {
    start.classList.add('hidden');
    stops.classList.remove('hidden');
    clearLogTable();
    previousReportData = [];
    initNumb = 0;
    progs.style.width = `0%`;
    progs.innerHTML = `0%`;
    allElements.forEach(e => e.disabled = true)
})

ipcRenderer.on('finish', (event) => {
    start.classList.remove('hidden');
    stops.classList.add('hidden');
    allElements.forEach(e => e.disabled = false)
})

stops.addEventListener('click', () => {
    if (confirm("Realy want to stop the proccess ?") == true) {
        start.classList.remove("hidden")
        stops.classList.add("hidden")
        ipcRenderer.send('stop');
    }
});

btnExport.onclick = () => {
    const wb = XLSX.utils.table_to_book(logTable);
    if (!wb['Sheets']['Sheet1']['!cols']) {
        wb['Sheets']['Sheet1']['!cols'] = [];
    }
    wb['Sheets']['Sheet1']['!cols'][0] = {
        width: 5
    };
    wb['Sheets']['Sheet1']['!cols'][1] = {
        width: 30
    };
    wb['Sheets']['Sheet1']['!cols'][2] = {
        width: 30
    };
    wb['Sheets']['Sheet1']['!cols'][3] = {
        width: 30
    };
    wb['Sheets']['Sheet1']['!cols'][4] = {
        width: 30
    };

    const data = XLSX.write(wb, {
        bookType: 'xlsx',
        type: 'array'
    });

    ipcRenderer.send('save-excel-data', data);
}

// Update code line
let updateProgress = 0;

ipcRenderer.send('app_version');
ipcRenderer.on('app_version', (event, arg) => {
    version.innerText = 'v' + arg.version;
});

ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    message.innerText = 'A new update is available. Downloading now...';
    warp.classList.remove('hidden');
    loaderDownload.classList.remove('hidden');
});

ipcRenderer.on('update_progress', (event, progress) => {
    updateProgress = progress;
    const progsDown = document.getElementById('download-progress')
    progsDown.style.width = updateProgress + '%'
    progsDown.setAttribute('aria-valuenow', updateProgress)
});

ipcRenderer.on('update_downloaded', () => {
    ipcRenderer.removeAllListeners('update_downloaded');
    message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
    restartButton.classList.remove('d-none');
    warp.classList.remove('hidden');

    loaderDownload.classList.add('hidden');
});

restartButton.addEventListener("click", (e) => {
    ipcRenderer.send('restart_app');
})