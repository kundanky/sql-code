export interface AppInfo {
  name: string;
  tagline: string;
  version: string;
  buildNumber: string;
  feedbackEmail: string;
  developerCredit: string;
  privacyPledge: string;
}

export const APP_INFO: AppInfo = {
  name: 'SQL CODE',
  tagline: 'Offline SQL editor for your phone',
  version: '1.2.0',
  buildNumber: '12',
  feedbackEmail: 'hopebig871@gmail.com',
  developerCredit: 'Built by Kundan Yadav',
  privacyPledge: 'All your queries, databases and files stay on this device. The app makes no network calls and collects no data.',
};
