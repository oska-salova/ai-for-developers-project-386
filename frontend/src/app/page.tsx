import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-semibold tracking-tight">Календарь звонков</h1>
          </CardTitle>
          <CardDescription>Выберите тип встречи и запишитесь на свободное время.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Записаться</Button>
        </CardContent>
      </Card>
    </main>
  );
}
