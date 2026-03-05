import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { supabase } from "../lib/supabase";

type TastingRow = {
  id: string;
  whiskey_name: string | null;
  rating: number;
  notes: string | null;
  created_at: string;
};

export default function SupabaseTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [tastings, setTastings] = useState<TastingRow[]>([]);
  const [sessionReady, setSessionReady] = useState(false);

  async function refresh() {
    const { data, error } = await supabase
      .from("tastings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setTastings(data ?? []);
  }

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setMessage("✅ Session restored");
        await refresh();
      } else {
        setMessage("Not signed in");
      }

      setSessionReady(true);
    };

    loadSession();
  }, []);

  const signUp = async () => {
    setMessage("Creating account...");
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage("❌ " + error.message);
    } else {
      setMessage("✅ Account created. Now sign in.");
    }
  };

  const signIn = async () => {
    setMessage("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setMessage("✅ Signed in!");
    await refresh();
  };

  if (!sessionReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading session…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>
        Supabase Session Test
      </Text>

      <Text>{message}</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}
      />

      <Pressable
        onPress={signUp}
        style={{
          backgroundColor: "#BE9663",
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white" }}>Sign Up</Text>
      </Pressable>

      <Pressable
        onPress={signIn}
        style={{
          backgroundColor: "#444",
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white" }}>Sign In</Text>
      </Pressable>

      {tastings.map((t) => (
        <View key={t.id} style={{ borderWidth: 1, padding: 10 }}>
          <Text>{t.whiskey_name}</Text>
          <Text>{t.rating}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
