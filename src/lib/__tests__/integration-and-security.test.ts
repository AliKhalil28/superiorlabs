import { describe, it, expect } from 'vitest';
import { encryptToken, decryptToken } from '@/lib/security/encryption';
import { searchGlobalMetadata, getDashboardMetrics, getPracticalById } from '@/lib/data/college-store';
import { runDriveSync } from '@/lib/drive/sync-service';

describe('Security & Encryption', () => {
  it('correctly encrypts and decrypts OAuth refresh tokens using AES-256-GCM', () => {
    const originalToken = '1//0gXyZ_SuperiorCollegeRefreshTokenExample1234567890';
    const encrypted = encryptToken(originalToken);

    // Verify format: iv:authTag:encrypted (in hex)
    expect(encrypted).toContain(':');
    const parts = encrypted.split(':');
    expect(parts.length).toBe(3);
    expect(encrypted).not.toEqual(originalToken);

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(originalToken);
  });

  it('fails decryption if encrypted payload has been tampered with', () => {
    const originalToken = 'super-secret-token';
    const encrypted = encryptToken(originalToken);
    const tampered = encrypted.slice(0, -4) + '0000';

    expect(() => decryptToken(tampered)).toThrow();
  });
});

describe('College Data Store & Metrics', () => {
  it('returns valid dashboard metrics with non-negative numbers', async () => {
    const metrics = await getDashboardMetrics();

    expect(metrics.total_academic_groups).toBeGreaterThan(0);
    expect(metrics.total_subjects).toBeGreaterThan(0);
    expect(metrics.total_expected_practicals).toBe(metrics.total_subjects * 10);
    expect(metrics.total_practical_folders_detected).toBeGreaterThanOrEqual(0);
    expect(metrics.total_practical_folders_with_submissions).toBeGreaterThanOrEqual(0);
    expect(metrics.total_empty_practical_folders).toBeGreaterThanOrEqual(0);
    expect(metrics.total_missing_practical_folders).toBeGreaterThanOrEqual(0);
    expect(metrics.total_submission_files).toBeGreaterThan(0);
  });

  it('preserves exact student submission filenames in Data Structure Lab 1', async () => {
    const practical = await getPracticalById('p-ds-lab-1');
    expect(practical).not.toBeNull();
    expect(practical?.name).toBe('Lab 1');
    expect(practical?.fileCount).toBe(25);

    // Verify exact filenames from Google Drive screenshot
    const fileNames = practical?.files.map((f) => f.name);
    expect(fileNames).toContain('Untitled1.cpp');
    expect(fileNames).toContain('Untitled1.exe');
    expect(fileNames).toContain('waleed Bin nisar.32-SE-2024.cpp');
    expect(fileNames).toContain('sameed roll no 31 SE.cpp');
    expect(fileNames).toContain('saifulah s.e.cpp');
  });

  it('prohibits reading or returning file body content', async () => {
    const practical = await getPracticalById('p-ds-lab-1');
    for (const file of practical?.files || []) {
      const record = file as unknown as Record<string, unknown>;
      // Must NOT contain body/contents or binary payloads
      expect(record.content).toBeUndefined();
      expect(record.body).toBeUndefined();
      expect(record.rawBuffer).toBeUndefined();
    }
  });

  it('searches filenames accurately across the metadata index', async () => {
    const searchResult = await searchGlobalMetadata('sameed');
    expect(searchResult.files.length).toBeGreaterThan(0);
    expect(searchResult.files[0].name).toContain('sameed');
    expect(searchResult.files[0].subjectName).toBe('Data Structure');
    expect(searchResult.files[0].practicalName).toBe('Lab 1');
  });

  it('reports simulated synchronization result when run offline', async () => {
    const syncRes = await runDriveSync({ jobType: 'manual', isMockFallbackAllowed: true });
    expect(syncRes.success).toBe(true);
    expect(syncRes.status).toBe('successful');
  });
});
