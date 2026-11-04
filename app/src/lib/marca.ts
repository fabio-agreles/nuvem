import pacote from "../../package.json";

/**
 * Nome que aparece para quem usa o app.
 *
 * O **identificador** continua `app.nuvem.Nuvem` e o binário continua `nuvem`:
 * mudar isso renomearia a pasta de configuração de todo mundo e o pacote do
 * Flatpak. O nome de exibição é só isto — e precisa bater com o site e com a
 * marca no console do Google.
 */
export const NOME = "Nuvem Sync";

/** Versão do `package.json`, a mesma que o Tauri põe no binário. */
export const VERSAO: string = pacote.version;
