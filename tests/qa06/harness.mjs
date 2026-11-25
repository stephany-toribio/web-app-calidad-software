import ts from 'typescript';
import fs from 'node:fs';
import vm from 'node:vm';

export function cargarMetodos(
  archivo,
  clase,
  nombres,
  contexto = {}
) {
  const codigo = fs.readFileSync(archivo, 'utf8');

  const fuente = ts.createSourceFile(
    archivo,
    codigo,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const componente = fuente.statements.find(
    nodo => ts.isClassDeclaration(nodo)
      && nodo.name?.text === clase
  );

  if (!componente) {
    throw new Error(`Clase no encontrada: ${clase}`);
  }

  const metodos = nombres.map(nombre => {
    const metodo = componente.members.find(
      nodo => ts.isMethodDeclaration(nodo)
        && nodo.name?.getText(fuente) === nombre
    );

    if (!metodo) {
      throw new Error(`Metodo no encontrado: ${nombre}`);
    }

    return metodo.getText(fuente);
  });

  const resultado = ts.transpileModule(
    `class Harness {
      ${metodos.join('\n')}
    }`,
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.None
      }
    }
  );

  return vm.runInNewContext(
    resultado.outputText + '\nHarness;',
    {
      console,
      URL,
      structuredClone,
      ...contexto
    }
  );
}

export function almacenamiento() {
  const datos = new Map();

  return {
    getItem: clave => datos.get(clave) ?? null,
    setItem: (clave, valor) =>
      datos.set(clave, String(valor)),
    removeItem: clave => datos.delete(clave),
    clear: () => datos.clear(),
    length: () => datos.size
  };
}

export function solicitudControlada() {
  let observador;

  return {
    subscribe(callbacks) {
      observador = callbacks;

      return {
        unsubscribe() {}
      };
    },

    responder(valor) {
      observador.next?.(valor);
      observador.complete?.();
    },

    fallar(error) {
      observador.error?.(error);
    }
  };
}
