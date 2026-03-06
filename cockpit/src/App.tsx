import { AuditTail } from "./panels/AuditTail";
import { AvatarPanel } from "./panels/AvatarPanel";
import { CompanionChat } from "./panels/CompanionChat";
import { HealthGrid } from "./panels/HealthGrid";
import { MissionConsole } from "./panels/MissionConsole";
import "./app.css";

export function App() {
  return (
    <div class="nexusmon-shell">
      <header class="nexusmon-header">
        <div class="nexusmon-title">NEXUSMON</div>
        <div class="nexusmon-subtitle">OPERATOR CONTROL PLANE · v2.2 · RUNTIME ACTIVE</div>
      </header>
      <main class="nexusmon-grid">
        <AvatarPanel />
        <HealthGrid />
        <MissionConsole />
        <AuditTail />
        <CompanionChat />
      </main>
    </div>
  );
}
