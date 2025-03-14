<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\SignupRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{

    public function signup(SignupRequest $request)
    {
        $data = $request->validated();

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => bcrypt($data['password']),
            ]);

            $token = $user->createToken('main')->plainTextToken;
            DB::commit();
            return response()->json(compact('user', 'token'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create user.'], 500);
        }
    }

    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Provided email address or password is incorrect'
            ], 422);
        }

        $user = Auth::user();

        DB::beginTransaction();
        try {
            $token = $user->createToken('main')->plainTextToken;
            DB::commit();
            return response()->json(compact('user', 'token'), 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to login.'], 500);
        }
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        DB::beginTransaction();
        try {
            $user->currentAccessToken()->delete();
            DB::commit();
            return response()->json(['message' => 'Logged out successfully.'], 204);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to logout.'], 500);
        }
    }
}