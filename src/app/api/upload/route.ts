import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { InstagramDataParser } from '@/lib/instagram-parser-server';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json(
        { error: 'File must be a ZIP file' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const zip = new JSZip();
    
    // Load the zip file
    await zip.loadAsync(buffer);
    
    // Create a temporary directory to extract the files
    const tempDir = path.join(os.tmpdir(), `instagram-data-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Extract all files to the temporary directory
    const promises: Promise<void>[] = [];
    
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        const filePath = path.join(tempDir, relativePath);
        const dirPath = path.dirname(filePath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Write file
        promises.push(
          zipEntry.async('nodebuffer').then((content) => {
            fs.writeFileSync(filePath, content);
          })
        );
      }
    });
    
    await Promise.all(promises);

    // Store the temp directory path in a cookie or session
    // For now, we'll return it and let the client store it
    return NextResponse.json({
      success: true,
      dataPath: tempDir,
      message: 'Instagram data uploaded successfully'
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: 'Failed to process the uploaded file' },
      { status: 500 }
    );
  }
}

// Clean up old temp directories
export async function DELETE(request: NextRequest) {
  try {
    const { dataPath } = await request.json();
    
    if (dataPath && fs.existsSync(dataPath)) {
      fs.rmSync(dataPath, { recursive: true, force: true });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cleaning up:', error);
    return NextResponse.json(
      { error: 'Failed to clean up temporary files' },
      { status: 500 }
    );
  }
}