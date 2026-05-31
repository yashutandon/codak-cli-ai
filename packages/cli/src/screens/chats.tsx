import { useParams } from "react-router";
import { useTheme } from "../providers/theme";
import { ChatShell } from "../components/chat-shell/shell";

export function Chat(){
    const {id}=useParams();

    return (
       <ChatShell onSubmit={()=>{}} inputDisabled loading/>
    )
}