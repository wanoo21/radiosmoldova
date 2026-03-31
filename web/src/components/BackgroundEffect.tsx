import { Match, Switch, onMount } from "solid-js";
import { bgEffect, initBgEffect } from "~/lib/bgEffect";
import Background from "~/components/Background";
import BackgroundBars from "~/components/BackgroundBars";
import BackgroundWaves from "~/components/BackgroundWaves";

export default function BackgroundEffect() {
  onMount(initBgEffect);

  return (
    <Switch>
      <Match when={bgEffect() === "orbs"}><Background /></Match>
      <Match when={bgEffect() === "bars"}><BackgroundBars /></Match>
      <Match when={bgEffect() === "waves"}><BackgroundWaves /></Match>
    </Switch>
  );
}
