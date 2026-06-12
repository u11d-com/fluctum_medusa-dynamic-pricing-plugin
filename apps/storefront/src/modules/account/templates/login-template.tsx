"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import { Surface } from "@modules/common/components/ui"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="w-full flex justify-center px-8 py-8">
      <Surface className="p-8 w-full max-w-sm">
        {currentView === "sign-in" ? (
          <Login setCurrentView={setCurrentView} />
        ) : (
          <Register setCurrentView={setCurrentView} />
        )}
      </Surface>
    </div>
  )
}

export default LoginTemplate
