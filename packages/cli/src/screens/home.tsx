import { useCallback } from "react";
import { InputBar } from "../components/cli-input/input-bar";
import { Header } from "../components/layout/header";
import { useNavigate } from "react-router";


export function Home() {

    const navigate = useNavigate();

    const  handleSubmit=useCallback((text:string)=>{
        navigate("/session/new",{state:{message:text}})
    },[navigate])

    return (
        <box 
            gap={2}
            position="relative"
            width="100%"
            height="100%">
                <Header/>
                <box width="100%">
                    <InputBar onSubmit={handleSubmit}/>
                </box>
        </box>
    )
}