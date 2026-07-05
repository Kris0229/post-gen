import { useParams } from 'react-router-dom';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-giants-black">文章 {id}</h1>
    </div>
  );
}
