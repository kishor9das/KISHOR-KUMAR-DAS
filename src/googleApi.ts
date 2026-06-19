import { Account } from './types';

// Google REST API endpoints and handlers
const GOOGLE_DRIVE_DISCOVERY_URL = 'https://www.googleapis.com/drive/v3/files';
const GOOGLE_SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const FOLDER_NAME = 'Password Book (পাসওয়ার্ড বুক)';
const SPREADSHEET_NAME = 'Password_Book_Database';
const SHEET_TAB_NAME = 'Accounts';

// Header row for sheet
const HEADERS = [
  'ID',
  'Platform',
  'Link',
  'Category',
  'Username',
  'Password',
  'Email',
  'Mobile',
  'Date of Opening',
  'Details',
  'Extra Fields'
];

/**
 * Perform a fetch with authorization header
 */
async function authedFetch(url: string, accessToken: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errText = await response.text();
    console.error(`API Error on ${url}:`, errText);
    throw new Error(`Google API request failed: ${response.statusText}. Details: ${errText}`);
  }
  return response.json();
}

/**
 * Searches or creates the "Password Book (পাসওয়ার্ড বুক)" folder in Google Drive.
 * Returns the folder ID.
 */
export async function getOrCreateDriveFolder(accessToken: string): Promise<string> {
  // 1. Search for folder
  const query = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const listUrl = `${GOOGLE_DRIVE_DISCOVERY_URL}?q=${query}&fields=files(id,name)`;
  const result = await authedFetch(listUrl, accessToken);
  
  if (result.files && result.files.length > 0) {
    return result.files[0].id;
  }
  
  // 2. Folder does not exist, create it
  console.log('Folder not found, creating new Google Drive folder');
  const createFolderUrl = GOOGLE_DRIVE_DISCOVERY_URL;
  const folderMeta = {
    name: FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  const folderResult = await authedFetch(createFolderUrl, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(folderMeta)
  });
  
  return folderResult.id;
}

/**
 * Searches or creates the "Password_Book_Database" Google Sheet inside the folder.
 * Returns the spreadsheet ID and ensures the "Accounts" tab sheet exists inside it.
 */
export async function getOrCreateSpreadsheet(accessToken: string, folderId: string): Promise<string> {
  // 1. Search for the Spreadsheet under the folder parent
  const query = encodeURIComponent(`name = '${SPREADSHEET_NAME}' and '${folderId}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const listUrl = `${GOOGLE_DRIVE_DISCOVERY_URL}?q=${query}&fields=files(id,name)`;
  const result = await authedFetch(listUrl, accessToken);
  
  let spreadsheetId = '';
  let isNewSpreadsheet = false;

  if (result.files && result.files.length > 0) {
    spreadsheetId = result.files[0].id;
  } else {
    // 2. Spreadsheet does not exist, create it
    console.log('Database Spreadsheet not found, creating a new one in Drive folder');
    const fileMeta = {
      name: SPREADSHEET_NAME,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [folderId]
    };
    
    const sheetResult = await authedFetch(GOOGLE_DRIVE_DISCOVERY_URL, accessToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileMeta)
    });
    
    spreadsheetId = sheetResult.id;
    isNewSpreadsheet = true;
  }

  // 3. Check if the "Accounts" worksheet tab exists within the spreadsheet
  const metadataUrl = `${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}`;
  const metadata = await authedFetch(metadataUrl, accessToken);
  const sheets = metadata.sheets || [];
  const hasAccountsTab = sheets.some((sheet: any) => sheet.properties.title === SHEET_TAB_NAME);

  if (!hasAccountsTab) {
    console.log(`Tab '${SHEET_TAB_NAME}' not found, adding layout...`);
    // Add the Accounts sheet tab
    const batchUpdateUrl = `${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}:batchUpdate`;
    await authedFetch(batchUpdateUrl, accessToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: SHEET_TAB_NAME
              }
            }
          }
        ]
      })
    });
    
    // Write headers
    await writeHeaders(accessToken, spreadsheetId);
  } else if (isNewSpreadsheet) {
    await writeHeaders(accessToken, spreadsheetId);
  }

  return spreadsheetId;
}

/**
 * Writes the header row in Sheet
 */
async function writeHeaders(accessToken: string, spreadsheetId: string) {
  const updateUrl = `${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}/values/${SHEET_TAB_NAME}!A1:K1?valueInputOption=USER_ENTERED`;
  await authedFetch(updateUrl, accessToken, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      range: `${SHEET_TAB_NAME}!A1:K1`,
      majorDimension: 'ROWS',
      values: [HEADERS]
    })
  });
}

/**
 * Read all Accounts records from Google Sheets spreadsheet
 */
export async function readAccountsFromSheet(accessToken: string, spreadsheetId: string): Promise<Account[]> {
  const getValuesUrl = `${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}/values/${SHEET_TAB_NAME}!A:Z`;
  const data = await authedFetch(getValuesUrl, accessToken);
  
  if (!data.values || data.values.length <= 1) {
    return []; // Only header or empty
  }
  
  // Extract values, skipping the first row (headers)
  const rows = data.values.slice(1);
  const accounts: Account[] = rows.map((row: any[]) => {
    // Parse extra fields safely
    let extraFieldsParsed: Record<string, string> = {};
    if (row[10]) {
      try {
        extraFieldsParsed = JSON.parse(row[10]);
      } catch (e) {
        console.error('Failed to parse extra fields custom JSON', row[10], e);
      }
    }

    return {
      id: row[0] || Math.random().toString(36).substring(2),
      platform: row[1] || '',
      link: row[2] || '',
      category: row[3] || '',
      username: row[4] || '',
      password: row[5] || '',
      email: row[6] || '',
      mobile: row[7] || '',
      dateOfOpening: row[8] || '',
      details: row[9] || '',
      extraFields: extraFieldsParsed
    };
  });

  return accounts;
}

/**
 * Sync entire accounts array back to Google Sheets.
 * Overwrites all spreadsheet content below the headers to guarantee accurate 1-to-1 sync.
 */
export async function syncAccountsToSheet(
  accessToken: string,
  spreadsheetId: string,
  accounts: Account[]
): Promise<void> {
  // 1. Clear old content starting from row A2
  const clearUrl = `${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}/values/${SHEET_TAB_NAME}!A2:Z10000:clear`;
  await authedFetch(clearUrl, accessToken, { method: 'POST' });

  if (accounts.length === 0) {
    return; // Sheet is now empty of records, but still has headers
  }

  // 2. Prepare new rows
  const rowValues = accounts.map((acc) => [
    acc.id,
    acc.platform,
    acc.link,
    acc.category,
    acc.username,
    acc.password,
    acc.email,
    acc.mobile,
    acc.dateOfOpening,
    acc.details,
    JSON.stringify(acc.extraFields || {})
  ]);

  // 3. Upload new rows
  const numRows = rowValues.length + 1; // Row A2 to row A(numRows)
  const updateUrl = `${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}/values/${SHEET_TAB_NAME}!A2:K${numRows}?valueInputOption=USER_ENTERED`;
  
  await authedFetch(updateUrl, accessToken, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      range: `${SHEET_TAB_NAME}!A2:K${numRows}`,
      majorDimension: 'ROWS',
      values: rowValues
    })
  });
}
