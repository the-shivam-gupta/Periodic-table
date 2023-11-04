import "./index.css";
import Element from "./components/Element";
import elements from "./database/periodic-table-lookup.json";

function App() {

  const matrix = [
    [1, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 2,],
    [3, 4, '', '', '', '', '', '', '', '', '', '', 5, 6, 7, 8, 9, 10,],
    [11, 12, '', '', '', '', '', '', '', '', '', '', 13, 14, 15, 16, 17, 18,],
    [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
    [55, 56, '', 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86],
    [87, 88, '', 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118],
  ];

  const matrixLan = [
    [57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71],
    [89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103],
  ];

  const elementsCategory = {
    "polyatomic nonmetal": "bg-[#22C55E]",
    "alkali metal": "bg-[#EF4444]",
    "alkaline earth metal": "bg-[#F59E0B]",
    "diatomic nonmetal": "bg-[#22C55E]",
    "transition metal": "bg-[#06B6D4]",
    "unknown, probably transition metal": "bg-[#CBD5E1]",
    "transition metal": "bg-[#8B5CF6]",
    "metalloid": "bg-[#EAB308]",
    "noble gas": "bg-[#EC4899]",
    "lanthanide": "bg-[#3B82F6]",
    "actinide": "bg-[#14B8A6]",
  };

  return (
    <div className="min-h-screen bg-green-200 flex flex-col items-center justify-center">

      <div className="w-auto h-auto bg-red-300">
        {matrix.map((row, i) => (
          <table key={i}>
            <tr className="">
              {row.map((element, j) => (
                typeof (element) == "number" ? <td>  <Element data={element} color={elementsCategory[elements[elements.order[element - 1]]['category']]} /></td> : <td colspan="3"><Element data={element} color="bg-green-200" /></td>
              ))}
            </tr>
          </table>
        ))}
      </div>

      <div className="w-auto h-auto bg-red-300 mt-5">
        {matrixLan.map((row, i) => (
          <table key={i}>
            <tr className="">
              {row.map((element, j) => (
                <td> <Element data={element} /></td>
              ))}
            </tr>

          </table>
        ))}
      </div>

    </div>
  );
}

export default App;
