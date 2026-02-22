import React, { useMemo } from 'react';

// --- Funções de Álgebra Linear ---
// (Não podemos usar bibliotecas externas, então implementamos uma solução simples para 3x3)

type Matrix3x3 = [[number, number, number], [number, number, number], [number, number, number]];
type Vector3 = [number, number, number];

/**
 * Por que sistemas lineares? Simulações físicas em jogos, como a de estruturas,
 * frequentemente modelam o mundo através de um conjunto de equações de equilíbrio.
 * Por exemplo, para um prédio estar "parado" (em equilíbrio estático), a soma
 * de todas as forças e torques atuando em qualquer ponto dele deve ser zero.
 * Essas relações de equilíbrio formam um sistema de equações lineares, onde as
 * incógnitas são as forças internas ou os deslocamentos dos componentes da estrutura.
 * Resolvê-lo nos permite saber como a carga (ex: vento, peso) se distribui e
 * se alguma parte vai quebrar.
 */


/**
 * Calcula o determinante de uma matriz 3x3.
 */
function determinant(m: Matrix3x3): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

/**
 * Calcula a inversa de uma matriz 3x3.
 * Retorna null se a matriz for singular (determinante é 0).
 */
function invert(m: Matrix3x3): Matrix3x3 | null {
  const det = determinant(m);
  if (Math.abs(det) < 1e-9) { // Verifica se o determinante é praticamente zero
    return null;
  }

  const invDet = 1 / det;
  const inv: Matrix3x3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  // Calcula a matriz adjunta e multiplica pelo inverso do determinante
  inv[0][0] = (m[1][1] * m[2][2] - m[2][1] * m[1][2]) * invDet;
  inv[0][1] = (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * invDet;
  inv[0][2] = (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * invDet;
  inv[1][0] = (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * invDet;
  inv[1][1] = (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * invDet;
  inv[1][2] = (m[1][0] * m[0][2] - m[0][0] * m[1][2]) * invDet;
  inv[2][0] = (m[1][0] * m[2][1] - m[2][0] * m[1][1]) * invDet;
  inv[2][1] = (m[2][0] * m[0][1] - m[0][0] * m[2][1]) * invDet;
  inv[2][2] = (m[0][0] * m[1][1] - m[1][0] * m[0][1]) * invDet;

  return inv;
}

/**
 * Multiplica uma matriz 3x3 por um vetor de 3 elementos.
 */
function multiply(m: Matrix3x3, v: Vector3): Vector3 {
  const result: Vector3 = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      result[i] += m[i][j] * v[j];
    }
  }
  return result;
}


const MatrixDisplay: React.FC<{ matrix: Matrix3x3 }> = ({ matrix }) => (
  <div className="font-mono text-sm inline-block">
    {matrix.map((row, i) => (
      <div key={i} className="flex justify-center">
        {row.map((val, j) => (
          <span key={j} className="w-20 text-center">{val.toFixed(2)}</span>
        ))}
      </div>
    ))}
  </div>
);

const VectorDisplay: React.FC<{ vector: Vector3; name: string }> = ({ vector, name }) => (
  <div className="font-mono text-sm inline-block text-center">
    <div className="font-bold">{name}</div>
    {vector.map((val, i) => (
      <div key={i}>{val.toFixed(0)}</div>
    ))}
  </div>
);


export const LinearSystemExplanation: React.FC = () => {
    // Cenário do Jogo:
    // Três pilares suportam uma plataforma. Cada pilar foi construído com um material diferente,
    // resultando em diferentes "rigidezes" (stiffness).
    // Uma força externa (ex: peso, vento) é aplicada na plataforma.
    const stiffness = {
        pillar1: 50,  // Pilar fraco (ex: Drywall)
        pillar2: 150, // Pilar médio (ex: Bloco Cerâmico)
        pillar3: 250, // Pilar forte (ex: Concreto Armado)
    };
    const externalForce = 1000; // Força externa total (em Newtons, por exemplo)

    // O problema:
    // Queremos encontrar as forças internas (F1, F2, F3) em cada pilar, que são as nossas incógnitas `x`.
    // Usamos o princípio do equilíbrio estático e a compatibilidade de deformação.
    //
    // Equações:
    // 1. Equilíbrio de Forças: A soma das forças nos pilares deve igualar a força externa.
    //    F1 + F2 + F3 = externalForce
    //
    // 2. Compatibilidade de Deformação: Como os pilares suportam uma plataforma rígida,
    //    a deformação (compressão) de todos deve ser a mesma.
    //    delta1 = delta2  =>  F1/k1 = F2/k2  =>  (1/k1)*F1 - (1/k2)*F2 = 0
    //
    // 3. Compatibilidade de Deformação (continuação):
    //    delta2 = delta3  =>  F2/k2 = F3/k3  =>  (1/k2)*F2 - (1/k3)*F3 = 0
    //
    // Isso nos dá um sistema linear 3x3 no formato Ax = b
    // A matriz 'A' contém as propriedades geométricas e de material (rigidez).
    // O vetor 'b' contém as forças externas conhecidas.
    // O vetor 'x' contém as forças internas desconhecidas que queremos encontrar.

    const A: Matrix3x3 = useMemo(() => [
        [1, 1, 1],
        [1 / stiffness.pillar1, -1 / stiffness.pillar2, 0],
        [0, 1 / stiffness.pillar2, -1 / stiffness.pillar3],
    ], [stiffness]);

    const b: Vector3 = useMemo(() => [externalForce, 0, 0], [externalForce]);

    // Resolve o sistema Ax = b para encontrar x.
    // O método é: x = A⁻¹ * b
    const solution = useMemo(() => {
        const A_inv = invert(A);
        if (A_inv) {
            return multiply(A_inv, b);
        }
        return null;
    }, [A, b]);


  return (
    <div className="mt-4 p-3 bg-slate-100/80 rounded-md text-slate-900 border border-slate-300 text-sm">
        <h4 className="font-bold text-center text-slate-700 mb-2">Exemplo: Distribuição de Carga em 3 Pilares</h4>
        <p className="mb-3 text-xs text-justify">
           Imagine que uma força de <strong>{externalForce}N</strong> é aplicada sobre uma plataforma suportada por 3 pilares de materiais diferentes (fraco, médio e forte). Para que a estrutura fique em equilíbrio, o jogo calcula a força que cada pilar precisa suportar resolvendo o sistema linear <strong>Ax = b</strong>.
        </p>
        
        <div className="flex items-center justify-center gap-2 mb-3">
            <div className="text-center">
                <div className="font-bold">Matriz A (Propriedades)</div>
                <MatrixDisplay matrix={A} />
            </div>
            <div className="font-mono text-2xl font-bold">x</div>
             <div className="text-center">
                <VectorDisplay vector={b} name="Vetor b (Forças Externas)" />
            </div>
        </div>

        {solution && (
            <div className="mt-3 text-center bg-slate-200 p-2 rounded">
                <h5 className="font-bold">Resultado (Vetor x - Forças nos Pilares):</h5>
                <p className="font-mono text-base">F1 (Fraco): <strong className="text-red-600">{solution[0].toFixed(1)} N</strong></p>
                <p className="font-mono text-base">F2 (Médio): <strong className="text-yellow-600">{solution[1].toFixed(1)} N</strong></p>
                <p className="font-mono text-base">F3 (Forte): <strong className="text-green-600">{solution[2].toFixed(1)} N</strong></p>
                <p className="text-xs mt-2 text-justify">
                    <strong>Interpretação:</strong> O pilar mais forte (F3) absorve a maior parte da carga, enquanto o mais fraco (F1) sofre menos. Se a força em um pilar exceder a resistência do seu material, ele sofrerá dano na simulação!
                </p>
            </div>
        )}
    </div>
  );
};
