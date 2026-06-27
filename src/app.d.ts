/// <reference types="@sveltejs/kit" />
/// <reference types="vite-plugin-pwa/vanillajs" />

declare namespace App {
  interface Error {
    message: string;
    category: ErrorCategory;
    timestamp: string;
  }

  interface Locals {}

  interface PageData {}

  interface PageState {}

  interface Platform {}
}
