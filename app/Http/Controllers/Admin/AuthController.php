<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function showLogin()
    {
        return view('admin.login');
    }

    public function login(Request $request)
    {
        $request->validate(['password' => 'required|string']);

        if (hash_equals((string) config('app.admin_password'), $request->string('password')->value())) {
            $request->session()->put('is_admin', true);

            return redirect()->route('admin.dashboard');
        }

        return back()->withErrors(['password' => '密碼錯誤']);
    }

    public function logout(Request $request)
    {
        $request->session()->forget('is_admin');

        return redirect()->route('admin.login');
    }
}
