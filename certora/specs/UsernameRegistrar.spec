rule sanity(env e, method f) {
    calldataarg args;
    f(e, args);
    satisfy true;
}