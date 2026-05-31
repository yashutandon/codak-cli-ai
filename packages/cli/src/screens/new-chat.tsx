import { useEffect  } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTheme } from "../providers/theme";
import { ErrorMessage } from "../components/messages/error-message";
import { UserMessage } from "../components/messages/user-message";
import { BotMessage } from "../components/messages/bot-message";
import { ChatShell } from "../components/chat-shell/shell";





export function NewChat(){
    const navigate=useNavigate();
    const location=useLocation();
    const {colors}=useTheme();

    const state=location.state as {message?: string} | null;
    useEffect(() => {
      if(!state?.message){
        navigate("/",{replace:true})
      }
    }, [state,navigate])
    if(!state?.message) return null;

    return (
        <ChatShell onSubmit={()=>{}} inputDisabled loading>
          <UserMessage message={state.message}/>
          <BotMessage content="This is a sample bot response to demonstrate the message layout" model="opus-4.6"/>
          <ErrorMessage message="This is a sample error message"/>
        </ChatShell>
    )
}