<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        if (User::query()->where('role', 'admin')->exists()) {
            abort(403, 'Первый администратор уже создан.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'sometimes|in:admin',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'company_id' => Company::firstOrCreate(['code' => 'DEMO'], ['name' => 'DEMO'])->id,
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function users()
    {
        return User::query()
            ->where('company_id', request()->user()->company_id)
            ->orderBy('name')
            ->get();
    }

    public function createUser(Request $request)
    {
        $allowedRoles = $request->user()->role === 'admin'
            ? ['initiator', 'treasurer', 'manager']
            : ['initiator', 'treasurer'];

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in($allowedRoles)],
        ]);

        $validated['company_id'] = $request->user()->company_id;
        return response()->json(User::create($validated), 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Неверный email или пароль.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function debugUsers()
    {
        abort_unless(config('app.debug'), 404);

        $users = DB::table('users')
            ->select(['id', 'name', 'email', 'role'])
            ->whereIn('id', function ($query) {
                $query->from('users')
                    ->selectRaw('MIN(id)')
                    ->groupBy('role');
            })
            ->orderBy('id')
            ->get();

        return response()->json($users);
    }

    public function debugLogin(User $user)
    {
        abort_unless(config('app.debug'), 404);

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('debug-api-token')->plainTextToken,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Выход выполнен']);
    }

    public function me(Request $request)
    {
        return $request->user();
    }
}
