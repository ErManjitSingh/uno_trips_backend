import { Head, Link } from '@inertiajs/react'
import WebLayout from '../../../Layouts/WebLayout'

export default function BlogShow({ post, related = [], seo }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    articleSection: post.category?.name,
  }

  return (
    <WebLayout title={post.seo_meta_title || post.title} description={post.seo_meta_description || post.excerpt} seo={seo}>
      <Head>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Head>
      <article className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <p className="text-xs text-amber-300">{post.category?.name}</p>
        <h1 className="mt-2 text-4xl font-semibold">{post.title}</h1>
        <p className="mt-4 text-slate-200">{post.excerpt}</p>
        <div className="prose prose-invert mt-8 max-w-none text-slate-300">{post.content}</div>
      </article>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <h3 className="text-2xl font-semibold">Related Articles</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {related.map((item) => (
            <Link key={item.id} href={`/blog/${item.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">{item.title}</Link>
          ))}
        </div>
      </section>
    </WebLayout>
  )
}
