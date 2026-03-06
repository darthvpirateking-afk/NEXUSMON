import "./app.css";
import { AuditTail } from "./panels/AuditTail";
import { AvatarPanel } from "./panels/AvatarPanel";
import { CompanionChat } from "./panels/CompanionChat";
import { HealthGrid } from "./panels/HealthGrid";
import { MissionConsole } from "./panels/MissionConsole";

export function App() {
  return (
    <div class="nexusmon-shell">
      <header class="nexusmon-header">
        <div class="nexusmon-title">NEXUSMON</div>
        <div class="nexusmon-subtitle">LIVE COCKPIT · BACKEND-LINKED PANELS ONLY</div>
      </header>

      <div class="nexusmon-grid">
        <AvatarPanel />
        <HealthGrid />
        <MissionConsole />
        <AuditTail />
        <CompanionChat />
      </div>
    </div>
  );
}
