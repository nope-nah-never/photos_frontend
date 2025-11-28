
const apigClient = apigClientFactory.newClient({
  apiKey: 'JifF4BSGuO4dOoR6R77HZ9vjFBuZsboY36fqm0iF'
});

// ========================================
// SEARCH
// ========================================

document.getElementById('searchBtn').onclick = function () {
  const q = document.getElementById('searchBox').value.trim();
  const statusEl = document.getElementById('searchStatus');

  if (!q) {
    statusEl.innerText = 'Please enter a search query.';
    return;
  }

  statusEl.innerText = 'Searching...';

  const params = { q };      // becomes ?q=... for /search
  const body = {};
  const additionalParams = {};

  // From SDK: apigClient.searchGet(params, body, additionalParams)
  apigClient.searchGet(params, body, additionalParams)
    .then(function (response) {
      // response.data may be either:
      // 1) { statusCode, headers, body: '{"results":[...]}' } (Lambda proxy)
      // 2) { results: [...] } (mapping template)
      let payload = response.data;

      if (payload && typeof payload.body === 'string') {
        try {
          payload = JSON.parse(payload.body);
        } catch (e) {
          console.error('Failed to parse body JSON:', e);
        }
      }

      const results = (payload && payload.results) ? payload.results : [];
      statusEl.innerText = `Found ${results.length} photo(s).`;
      renderResults(results);
    })
    .catch(function (err) {
      console.error('Search error', err);
      statusEl.innerText = 'Search failed. See console for details.';
    });
};

function renderResults(results) {
  const container = document.getElementById('results');
  container.innerHTML = '';

  if (!results || results.length === 0) {
    container.innerText = 'No results.';
    return;
  }

  results.forEach(result => {
    if (!result.url) return;

    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-block';
    wrapper.style.margin = '10px';
    wrapper.style.textAlign = 'center';

    const img = document.createElement('img');
    img.src = result.url;    // presigned URL from Lambda
    console.log(img.src)
    img.alt = 'Photo';
    img.style.maxWidth = '200px';
    img.style.borderRadius = '4px';
    img.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';

    wrapper.appendChild(img);

    if (Array.isArray(result.labels) && result.labels.length > 0) {
      const caption = document.createElement('div');
      caption.style.marginTop = '4px';
      caption.style.fontSize = '12px';
      caption.style.color = '#555';
      caption.innerText = result.labels.join(', ');
      wrapper.appendChild(caption);
    }

    container.appendChild(wrapper);
  });
}

// ========================================
// UPLOAD
// ========================================

document.getElementById('uploadBtn').onclick = function () {
  const fileInput = document.getElementById('fileInput');
  const labelsInput = document.getElementById('customLabels');
  const statusEl = document.getElementById('uploadStatus');

  if (!fileInput.files.length) {
    statusEl.innerText = 'Please choose an image file.';
    return;
  }

  const file = fileInput.files[0];
  const customLabels = labelsInput.value.trim();

  statusEl.innerText = 'Uploading...';

  const reader = new FileReader();
  // reader.onload = function (e) {
  //   const fileData = e.target.result;
  //   const params = {
  //     filename: file.name,
  //     'Content-Type': file.type,
  //     'x-amz-meta-customLabels': customLabels
  //   };

  reader.onload = function (e) {
    const arrayBuffer = e.target.result;
    const uint8Array = new Uint8Array(arrayBuffer);
    const params = {
      filename: file.name,
      "Content-Type": file.type,
      "x-amz-meta-customLabels": customLabels
    };

    const body = fileData;
    const additionalParams = {};

    apigClient.uploadFilenamePut(params, uint8Array, additionalParams)
      .then(function (response) {
        console.log('Upload response', response);
        statusEl.innerText = 'Upload successful!';
      })
      .catch(function (err) {
        console.error('Upload error', err);
        statusEl.innerText = 'Upload failed. See console for details.';
      });
  };

  // Important: read as ArrayBuffer so the SDK can send binary body
  reader.readAsArrayBuffer(file);
};
