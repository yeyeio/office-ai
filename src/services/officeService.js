/**
 * Office.js Integration Service for Microsoft Word
 * Handles safe reading, insertion, replacement, and status detection.
 */

import DOMPurify from "dompurify";

export function isWordEnvironment() {
  return typeof Word !== "undefined";
}

export function initOffice(onStatusChange) {
  if (typeof Office !== "undefined" && Office.onReady) {
    Office.onReady((info) => {
      const isWord = isWordEnvironment() || (info && (info.host === Office.HostType.Word || info.host === "Word"));
      if (isWord) {
        onStatusChange({ connected: true, host: "Word", message: "Word Terhubung" });
      } else {
        onStatusChange({ connected: false, host: "Browser", message: "Browser Mode" });
      }
    });
  } else {
    onStatusChange({ connected: false, host: "Standalone", message: "Standalone Preview" });
  }
}

/**
 * Reads currently selected text in Word document
 */
export async function getSelectedDocumentText() {
  if (!isWordEnvironment()) return "";
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.load("text");
      await context.sync();
      resolve(selection.text ? selection.text.trim() : "");
    }).catch((err) => {
      console.warn("Gagal membaca selection:", err);
      resolve("");
    });
  });
}

/**
 * Reads entire document body text in Word
 */
export async function getFullDocumentText() {
  if (!isWordEnvironment()) return "";
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body;
      body.load("text");
      await context.sync();
      resolve(body.text ? body.text.trim() : "");
    }).catch((err) => {
      console.warn("Gagal membaca seluruh dokumen:", err);
      resolve("");
    });
  });
}

/**
 * Formats Markdown into HTML and inserts into Word range
 */
export function insertFormattedContent(range, markdownText, location, markedParser) {
  let html = "";
  if (markedParser) {
    try {
      const rawHtml = markedParser(markdownText);
      html = DOMPurify.sanitize(rawHtml);
    } catch {
      html = `<p>${markdownText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
    }
  } else {
    html = `<p>${markdownText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
  }

  try {
    range.insertHtml(html, location);
  } catch (e) {
    console.warn("insertHtml gagal, fallback ke insertText:", e);
    range.insertText(markdownText, location);
  }
}

/**
 * Replaces selected text in Word with generated text.
 * If selection is empty, safely inserts after cursor to protect formatting and images.
 */
export async function replaceSelectionInDocument(text, markedParser) {
  if (!isWordEnvironment()) {
    throw new Error("Buka di dalam Microsoft Word untuk mengedit dokumen.");
  }
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.load("text");
    await context.sync();

    if (!selection.text || selection.text.trim().length === 0) {
      // Safe fallback: insert after cursor so existing content is untouched
      insertFormattedContent(selection, text, Word.InsertLocation.after, markedParser);
      await context.sync();
      return "Teks disisipkan di posisi kursor (format & gambar aman).";
    } else {
      insertFormattedContent(selection, text, Word.InsertLocation.replace, markedParser);
      await context.sync();
      return "Teks yang diblok berhasil diganti.";
    }
  });
}

/**
 * Inserts text right after the current cursor location.
 * Existing text, pictures, and formatting are 100% preserved.
 */
export async function insertAtCursorInDocument(text, markedParser) {
  if (!isWordEnvironment()) {
    throw new Error("Buka di dalam Microsoft Word untuk menyisipkan teks.");
  }
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    insertFormattedContent(selection, text, Word.InsertLocation.after, markedParser);
    await context.sync();
    return "Teks berhasil disisipkan di posisi kursor.";
  }).catch((err) => {
    // Fallback: append to end of document body
    return Word.run(async (context) => {
      insertFormattedContent(context.document.body, text, Word.InsertLocation.end, markedParser);
      await context.sync();
      return "Teks disisipkan di akhir dokumen (fallback).";
    });
  });
}

/**
 * Appends text at the very end of the Word document.
 */
export async function appendToDocumentEnd(text, markedParser) {
  if (!isWordEnvironment()) {
    throw new Error("Buka di dalam Microsoft Word untuk menambah teks.");
  }
  return Word.run(async (context) => {
    insertFormattedContent(context.document.body, text, Word.InsertLocation.end, markedParser);
    await context.sync();
    return "Teks berhasil ditambahkan di akhir dokumen.";
  });
}
